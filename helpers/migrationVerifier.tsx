/**
 * Migration Verifier Helper
 * 
 * Verification signals for data migration with rollback criteria.
 * Ensures data integrity after populate/refresh operations.
 */

import type { Kysely } from "kysely";
import type { DB } from "./schema";

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  summary: VerificationSummary;
  rollbackRecommended: boolean;
  rollbackReason?: string;
}

export interface VerificationCheck {
  name: string;
  category: "row_count" | "referential_integrity" | "spot_check" | "computed";
  passed: boolean;
  expected?: number | string;
  actual?: number | string;
  message: string;
  critical: boolean;
}

export interface VerificationSummary {
  totalChecks: number;
  passed: number;
  failed: number;
  criticalFailures: number;
}

// ============================================================================
// ROW COUNT VERIFICATION
// ============================================================================

export interface RowCountExpectations {
  workExperiences?: { min: number; max?: number };
  educationEntries?: { min: number; max?: number };
  skills?: { min: number; max?: number };
  resumeVariants?: { min: number; max?: number };
  viewDefinitions?: { min: number; max?: number };
}

async function verifyRowCounts(
  db: Kysely<DB>,
  profileId: string,
  workspaceId: string,
  expectations: RowCountExpectations
): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];

  // Work experiences
  if (expectations.workExperiences) {
    const count = await db
      .selectFrom("workExperiences")
      .select(db.fn.count("id").as("count"))
      .where("profileId", "=", profileId)
      .executeTakeFirst();
    
    const actual = Number(count?.count || 0);
    const { min, max } = expectations.workExperiences;
    const passed = actual >= min && (max === undefined || actual <= max);

    checks.push({
      name: "Work experiences count",
      category: "row_count",
      passed,
      expected: max ? `${min}-${max}` : `≥${min}`,
      actual: actual.toString(),
      message: passed
        ? `Work experiences count (${actual}) is within expected range`
        : `Work experiences count (${actual}) is outside expected range`,
      critical: true,
    });
  }

  // Education entries
  if (expectations.educationEntries) {
    const count = await db
      .selectFrom("educationEntries")
      .select(db.fn.count("id").as("count"))
      .where("profileId", "=", profileId)
      .executeTakeFirst();
    
    const actual = Number(count?.count || 0);
    const { min, max } = expectations.educationEntries;
    const passed = actual >= min && (max === undefined || actual <= max);

    checks.push({
      name: "Education entries count",
      category: "row_count",
      passed,
      expected: max ? `${min}-${max}` : `≥${min}`,
      actual: actual.toString(),
      message: passed
        ? `Education entries count (${actual}) is within expected range`
        : `Education entries count (${actual}) is outside expected range`,
      critical: true,
    });
  }

  // Skills
  if (expectations.skills) {
    const count = await db
      .selectFrom("skills")
      .select(db.fn.count("id").as("count"))
      .where("profileId", "=", profileId)
      .executeTakeFirst();
    
    const actual = Number(count?.count || 0);
    const { min, max } = expectations.skills;
    const passed = actual >= min && (max === undefined || actual <= max);

    checks.push({
      name: "Profile skills count",
      category: "row_count",
      passed,
      expected: max ? `${min}-${max}` : `≥${min}`,
      actual: actual.toString(),
      message: passed
        ? `Profile skills count (${actual}) is within expected range`
        : `Profile skills count (${actual}) is outside expected range`,
      critical: false,
    });
  }

  // View definitions
  if (expectations.viewDefinitions) {
    const count = await db
      .selectFrom("viewDefinitions")
      .select(db.fn.count("id").as("count"))
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();
    
    const actual = Number(count?.count || 0);
    const { min, max } = expectations.viewDefinitions;
    const passed = actual >= min && (max === undefined || actual <= max);

    checks.push({
      name: "View definitions count",
      category: "row_count",
      passed,
      expected: max ? `${min}-${max}` : `≥${min}`,
      actual: actual.toString(),
      message: passed
        ? `View definitions count (${actual}) is within expected range`
        : `View definitions count (${actual}) is outside expected range`,
      critical: false,
    });
  }

  return checks;
}

// ============================================================================
// REFERENTIAL INTEGRITY CHECKS
// ============================================================================

async function verifyReferentialIntegrity(
  db: Kysely<DB>,
  profileId: string,
  workspaceId: string
): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];

  // Work experiences → Profile FK
  const orphanedWork = await db
    .selectFrom("workExperiences")
    .select(db.fn.count("id").as("count"))
    .where("profileId", "=", profileId)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom("profiles")
            .select("id")
            .whereRef("profiles.id", "=", "workExperiences.profileId")
        )
      )
    )
    .executeTakeFirst();

  const orphanedWorkCount = Number(orphanedWork?.count || 0);
  checks.push({
    name: "Work experiences FK integrity",
    category: "referential_integrity",
    passed: orphanedWorkCount === 0,
    expected: "0",
    actual: orphanedWorkCount.toString(),
    message: orphanedWorkCount === 0
      ? "All work experiences have valid profile references"
      : `${orphanedWorkCount} orphaned work experience(s) found`,
    critical: true,
  });

  // Education entries → Profile FK
  const orphanedEdu = await db
    .selectFrom("educationEntries")
    .select(db.fn.count("id").as("count"))
    .where("profileId", "=", profileId)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom("profiles")
            .select("id")
            .whereRef("profiles.id", "=", "educationEntries.profileId")
        )
      )
    )
    .executeTakeFirst();

  const orphanedEduCount = Number(orphanedEdu?.count || 0);
  checks.push({
    name: "Education entries FK integrity",
    category: "referential_integrity",
    passed: orphanedEduCount === 0,
    expected: "0",
    actual: orphanedEduCount.toString(),
    message: orphanedEduCount === 0
      ? "All education entries have valid profile references"
      : `${orphanedEduCount} orphaned education entry(ies) found`,
    critical: true,
  });

  // Variants → Profile FK
  const orphanedVariants = await db
    .selectFrom("resumeVariants")
    .select(db.fn.count("id").as("count"))
    .where("workspaceId", "=", workspaceId)
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom("profiles")
            .select("id")
            .whereRef("profiles.id", "=", "resumeVariants.profileId")
        )
      )
    )
    .executeTakeFirst();

  const orphanedVariantCount = Number(orphanedVariants?.count || 0);
  checks.push({
    name: "Resume variants FK integrity",
    category: "referential_integrity",
    passed: orphanedVariantCount === 0,
    expected: "0",
    actual: orphanedVariantCount.toString(),
    message: orphanedVariantCount === 0
      ? "All resume variants have valid profile references"
      : `${orphanedVariantCount} orphaned variant(s) found`,
    critical: true,
  });

  // Snapshots → Variant FK
  const orphanedSnapshots = await db
    .selectFrom("versionSnapshots")
    .select(db.fn.count("id").as("count"))
    .where((eb) =>
      eb.not(
        eb.exists(
          eb.selectFrom("resumeVariants")
            .select("id")
            .whereRef("resumeVariants.id", "=", "versionSnapshots.resumeVariantId")
        )
      )
    )
    .executeTakeFirst();

  const orphanedSnapshotCount = Number(orphanedSnapshots?.count || 0);
  checks.push({
    name: "Version snapshots FK integrity",
    category: "referential_integrity",
    passed: orphanedSnapshotCount === 0,
    expected: "0",
    actual: orphanedSnapshotCount.toString(),
    message: orphanedSnapshotCount === 0
      ? "All snapshots have valid variant references"
      : `${orphanedSnapshotCount} orphaned snapshot(s) found`,
    critical: true,
  });

  return checks;
}

// ============================================================================
// SPOT CHECK VERIFICATION
// ============================================================================

async function verifySpotChecks(
  db: Kysely<DB>,
  profileId: string
): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];

  // Verify profile has required fields
  const profile = await db
    .selectFrom("profiles")
    .select(["id", "fullName", "email", "workspaceId"])
    .where("id", "=", profileId)
    .executeTakeFirst();

  checks.push({
    name: "Profile exists with required fields",
    category: "spot_check",
    passed: !!profile && !!profile.fullName && !!profile.workspaceId,
    expected: "Profile with fullName and workspaceId",
    actual: profile
      ? `fullName: ${profile.fullName ? "✓" : "✗"}, workspaceId: ${profile.workspaceId ? "✓" : "✗"}`
      : "Profile not found",
    message: profile
      ? "Profile has required fields"
      : "Profile missing or incomplete",
    critical: true,
  });

  // Verify work experiences have required fields
  const workSample = await db
    .selectFrom("workExperiences")
    .select(["id", "company", "position", "startDate"])
    .where("profileId", "=", profileId)
    .limit(5)
    .execute();

  const invalidWork = workSample.filter((w) => !w.company || !w.position);
  checks.push({
    name: "Work experiences have required fields",
    category: "spot_check",
    passed: invalidWork.length === 0,
    expected: "All work entries have company and position",
    actual: `${workSample.length - invalidWork.length}/${workSample.length} valid`,
    message: invalidWork.length === 0
      ? "Sampled work experiences are valid"
      : `${invalidWork.length} work experience(s) missing required fields`,
    critical: false,
  });

  return checks;
}

// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================

export interface VerifyMigrationOptions {
  profileId: string;
  workspaceId: string;
  expectations?: RowCountExpectations;
  skipReferentialIntegrity?: boolean;
  skipSpotChecks?: boolean;
}

export async function verifyMigration(
  db: Kysely<DB>,
  options: VerifyMigrationOptions
): Promise<VerificationResult> {
  const {
    profileId,
    workspaceId,
    expectations = {},
    skipReferentialIntegrity = false,
    skipSpotChecks = false,
  } = options;

  const allChecks: VerificationCheck[] = [];

  // Row count checks
  const rowCountChecks = await verifyRowCounts(
    db,
    profileId,
    workspaceId,
    expectations
  );
  allChecks.push(...rowCountChecks);

  // Referential integrity checks
  if (!skipReferentialIntegrity) {
    const fkChecks = await verifyReferentialIntegrity(db, profileId, workspaceId);
    allChecks.push(...fkChecks);
  }

  // Spot checks
  if (!skipSpotChecks) {
    const spotChecks = await verifySpotChecks(db, profileId);
    allChecks.push(...spotChecks);
  }

  // Calculate summary
  const passed = allChecks.filter((c) => c.passed).length;
  const failed = allChecks.filter((c) => !c.passed).length;
  const criticalFailures = allChecks.filter((c) => !c.passed && c.critical).length;

  const summary: VerificationSummary = {
    totalChecks: allChecks.length,
    passed,
    failed,
    criticalFailures,
  };

  // Determine rollback recommendation
  const rollbackRecommended = criticalFailures > 0;
  const rollbackReason = rollbackRecommended
    ? `${criticalFailures} critical check(s) failed: ${allChecks
        .filter((c) => !c.passed && c.critical)
        .map((c) => c.name)
        .join(", ")}`
    : undefined;

  return {
    passed: failed === 0,
    checks: allChecks,
    summary,
    rollbackRecommended,
    rollbackReason,
  };
}

// ============================================================================
// QUICK HEALTH CHECK
// ============================================================================

export async function quickHealthCheck(
  db: Kysely<DB>,
  workspaceId: string
): Promise<{
  healthy: boolean;
  profileExists: boolean;
  hasWorkExperiences: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasPresets: boolean;
}> {
  // Check for profile
  const profile = await db
    .selectFrom("profiles")
    .select("id")
    .where("workspaceId", "=", workspaceId)
    .executeTakeFirst();

  const profileId = profile?.id;

  // Check for work experiences
  const workCount = profileId
    ? await db
        .selectFrom("workExperiences")
        .select(db.fn.count("id").as("count"))
        .where("profileId", "=", profileId)
        .executeTakeFirst()
    : null;

  // Check for education
  const eduCount = profileId
    ? await db
        .selectFrom("educationEntries")
        .select(db.fn.count("id").as("count"))
        .where("profileId", "=", profileId)
        .executeTakeFirst()
    : null;

  // Check for skills
  const skillCount = profileId
    ? await db
        .selectFrom("skills")
        .select(db.fn.count("id").as("count"))
        .where("profileId", "=", profileId)
        .executeTakeFirst()
    : null;

  // Check for presets
  const presetCount = await db
    .selectFrom("viewDefinitions")
    .select(db.fn.count("id").as("count"))
    .where("workspaceId", "=", workspaceId)
    .executeTakeFirst();

  const hasWork = Number(workCount?.count || 0) > 0;
  const hasEdu = Number(eduCount?.count || 0) > 0;
  const hasSkills = Number(skillCount?.count || 0) > 0;
  const hasPresets = Number(presetCount?.count || 0) > 0;

  return {
    healthy: !!profileId && (hasWork || hasEdu || hasSkills),
    profileExists: !!profileId,
    hasWorkExperiences: hasWork,
    hasEducation: hasEdu,
    hasSkills: hasSkills,
    hasPresets: hasPresets,
  };
}
