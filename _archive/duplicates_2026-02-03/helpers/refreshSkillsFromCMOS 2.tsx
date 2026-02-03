/**
 * Refresh Skills From CMOS Helper
 * 
 * One-way sync from CMOS skills to profile skills.
 * Preserves manual resume edits by only adding new skills.
 * 
 * Design decisions:
 * - User-triggered via explicit "Refresh" action
 * - Only adds skills that don't exist in profile
 * - Never modifies or deletes existing profile skills
 * - Supports dry-run for preview
 */

import { nanoid } from "nanoid";
import type { Kysely, Selectable } from "kysely";
import type { DB, Skills } from "./schema";

// Use Selectable to get the query result types (raw column values)
type SkillRow = Selectable<Skills>;

// ============================================================================
// TYPES
// ============================================================================

export interface RefreshSkillsOptions {
  workspaceId: string;
  profileId: string;
  dryRun?: boolean;
  categoryFilter?: string[];
}

export interface RefreshSkillsResult {
  success: boolean;
  dryRun: boolean;
  skillsAdded: number;
  skillsSkipped: number;
  skillsInProfile: number;
  skillsInCmos: number;
  newSkills: SkillDiff[];
  errors: string[];
}

export interface SkillDiff {
  sourceId: string;
  name: string;
  category?: string | null;
  level?: string | null;
  action: "add" | "skip";
  reason?: string;
}

// ============================================================================
// NORMALIZATION
// ============================================================================

function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.\-_]/g, "") // Remove dots, dashes, underscores
    .replace(/js$/i, "javascript") // Normalize JS → JavaScript
    .replace(/ts$/i, "typescript"); // Normalize TS → TypeScript
}

function buildSkillNameIndex(skills: { name: string }[]): Set<string> {
  const index = new Set<string>();
  for (const skill of skills) {
    index.add(normalizeSkillName(skill.name));
  }
  return index;
}

// ============================================================================
// LEVEL MAPPING
// ============================================================================

const PROFICIENCY_TO_LEVEL: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  expert: "expert",
};

function mapProficiencyToLevel(proficiency: string | null | undefined): string {
  if (!proficiency) {return "intermediate";}
  const prof = String(proficiency);
  return PROFICIENCY_TO_LEVEL[prof] || "intermediate";
}

// ============================================================================
// MAIN REFRESH FUNCTION
// ============================================================================

export async function refreshSkillsFromCMOS(
  db: Kysely<DB>,
  options: RefreshSkillsOptions
): Promise<RefreshSkillsResult> {
  const {
    workspaceId,
    profileId,
    dryRun = false,
    categoryFilter,
  } = options;

  const result: RefreshSkillsResult = {
    success: true,
    dryRun,
    skillsAdded: 0,
    skillsSkipped: 0,
    skillsInProfile: 0,
    skillsInCmos: 0,
    newSkills: [],
    errors: [],
  };

  try {
    // Fetch existing profile skills
    const profileSkills = await db
      .selectFrom("skills")
      .select(["id", "name", "category", "level"])
      .where("profileId", "=", profileId)
      .execute();

    result.skillsInProfile = profileSkills.length;

    // Build normalized name index for duplicate detection
    const existingNamesIndex = buildSkillNameIndex(profileSkills);

    // Fetch CMOS skills (not linked to profile)
    let cmosQuery = db
      .selectFrom("skills")
      .selectAll()
      .where("workspaceId", "=", workspaceId)
      .where("profileId", "is", null);

    // Apply category filter if provided
    if (categoryFilter && categoryFilter.length > 0) {
      cmosQuery = cmosQuery.where("category", "in", categoryFilter);
    }

    const cmosSkills = await cmosQuery.execute();
    result.skillsInCmos = cmosSkills.length;

    // Process each CMOS skill
    const skillsToAdd: SkillRow[] = [];

    for (const skill of cmosSkills) {
      const normalizedName = normalizeSkillName(skill.name);
      
      if (existingNamesIndex.has(normalizedName)) {
        result.newSkills.push({
          sourceId: skill.id,
          name: skill.name,
          category: skill.category,
          level: mapProficiencyToLevel(skill.proficiency),
          action: "skip",
          reason: "Already exists in profile",
        });
        result.skillsSkipped++;
      } else {
        result.newSkills.push({
          sourceId: skill.id,
          name: skill.name,
          category: skill.category,
          level: mapProficiencyToLevel(skill.proficiency),
          action: "add",
        });
        skillsToAdd.push(skill);
        result.skillsAdded++;
        
        // Add to index to prevent duplicates within same batch
        existingNamesIndex.add(normalizedName);
      }
    }

    // If dry run, return without persisting
    if (dryRun) {
      return result;
    }

    // Persist new skills to profile
    for (const skill of skillsToAdd) {
      const id = nanoid();
      const level = mapProficiencyToLevel(skill.proficiency);

      await db
        .insertInto("skills")
        .values({
          id,
          workspaceId,
          profileId,
          name: skill.name,
          category: skill.category,
          level,
          keywords: skill.keywords,
          proficiency: skill.proficiency,
          notes: skill.notes,
        })
        .execute();

      // Create provenance link for audit trail
      await db
        .insertInto("provenanceLinks")
        .values({
          id: nanoid(),
          workspaceId,
          targetTable: "skills",
          targetId: id,
          targetField: null,
          sourceType: "cmos_skill_refresh",
          sourceArtifactId: null,
          sourceDate: new Date(),
          confidence: "high",
          notes: `Refreshed from CMOS skill: ${skill.id} (${skill.name})`,
        })
        .execute();
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error during skill refresh"
    );
    return result;
  }
}

// ============================================================================
// CATEGORY HELPERS
// ============================================================================

export async function getCmosSkillCategories(
  db: Kysely<DB>,
  workspaceId: string
): Promise<string[]> {
  const results = await db
    .selectFrom("skills")
    .select("category")
    .distinct()
    .where("workspaceId", "=", workspaceId)
    .where("profileId", "is", null)
    .where("category", "is not", null)
    .execute();

  return results
    .map((r) => r.category)
    .filter((c): c is string => c !== null)
    .sort();
}

export async function getProfileSkillCategories(
  db: Kysely<DB>,
  profileId: string
): Promise<string[]> {
  const results = await db
    .selectFrom("skills")
    .select("category")
    .distinct()
    .where("profileId", "=", profileId)
    .where("category", "is not", null)
    .execute();

  return results
    .map((r) => r.category)
    .filter((c): c is string => c !== null)
    .sort();
}

// ============================================================================
// DIFF REPORT
// ============================================================================

export interface SkillSyncReport {
  inBoth: number;
  onlyInCmos: number;
  onlyInProfile: number;
  cmosSkillsNotInProfile: Array<{ name: string; category?: string | null }>;
  profileSkillsNotInCmos: Array<{ name: string; category?: string | null }>;
}

export async function generateSkillSyncReport(
  db: Kysely<DB>,
  workspaceId: string,
  profileId: string
): Promise<SkillSyncReport> {
  // Fetch both skill sets
  const cmosSkills = await db
    .selectFrom("skills")
    .select(["name", "category"])
    .where("workspaceId", "=", workspaceId)
    .where("profileId", "is", null)
    .execute();

  const profileSkills = await db
    .selectFrom("skills")
    .select(["name", "category"])
    .where("profileId", "=", profileId)
    .execute();

  // Build normalized indexes
  const cmosIndex = buildSkillNameIndex(cmosSkills);
  const profileIndex = buildSkillNameIndex(profileSkills);

  // Calculate diffs
  const cmosNotInProfile = cmosSkills.filter(
    (s) => !profileIndex.has(normalizeSkillName(s.name))
  );
  const profileNotInCmos = profileSkills.filter(
    (s) => !cmosIndex.has(normalizeSkillName(s.name))
  );

  const inBoth = cmosSkills.length - cmosNotInProfile.length;

  return {
    inBoth,
    onlyInCmos: cmosNotInProfile.length,
    onlyInProfile: profileNotInCmos.length,
    cmosSkillsNotInProfile: cmosNotInProfile,
    profileSkillsNotInCmos: profileNotInCmos,
  };
}
