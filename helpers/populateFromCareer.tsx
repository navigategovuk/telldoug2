/**
 * Populate From Career Helper
 * 
 * One-way migration from CMOS career data (jobs, learning, skills)
 * to profile data (workExperiences, educationEntries, skills).
 * 
 * Design decisions:
 * - User-triggered, not automatic
 * - Merge mode by default (append, don't overwrite)
 * - Tracks provenance for audit trail
 * - Supports dry-run for preview
 */

import { nanoid } from "nanoid";
import type { Kysely, Selectable } from "kysely";
import type { DB, Jobs, Learning, Skills } from "./schema";

// Use Selectable to get the query result types
type JobRow = Selectable<Jobs>;
type LearningRow = Selectable<Learning>;
type SkillRow = Selectable<Skills>;

// ============================================================================
// TYPES
// ============================================================================

export interface PopulateOptions {
  workspaceId: string;
  profileId: string;
  dryRun?: boolean;
  mode?: "merge" | "replace";
  includeJobs?: boolean;
  includeLearning?: boolean;
  includeSkills?: boolean;
}

export interface PopulateResult {
  success: boolean;
  dryRun: boolean;
  workCreated: number;
  workSkipped: number;
  educationCreated: number;
  educationSkipped: number;
  skillsCreated: number;
  skillsSkipped: number;
  errors: PopulateError[];
  preview?: PopulatePreview;
}

export interface PopulateError {
  source: "jobs" | "learning" | "skills";
  sourceId: string;
  message: string;
}

export interface PopulatePreview {
  workToCreate: MappedWork[];
  educationToCreate: MappedEducation[];
  skillsToCreate: MappedSkill[];
}

export interface MappedWork {
  sourceId: string;
  company: string;
  position: string;
  startDate?: Date | null;
  endDate?: Date | null;
  summary?: string | null;
  highlights?: string[];
}

export interface MappedEducation {
  sourceId: string;
  institution: string;
  area?: string | null;
  studyType?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface MappedSkill {
  sourceId: string;
  name: string;
  category?: string | null;
  level?: string | null;
  keywords?: string[];
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapJobToWork(job: JobRow): MappedWork {
  return {
    sourceId: job.id,
    company: job.company,
    position: job.title,
    startDate: job.startDate ? new Date(job.startDate as unknown as string) : null,
    endDate: job.endDate ? new Date(job.endDate as unknown as string) : null,
    summary: job.summary || job.description,
    highlights: Array.isArray(job.highlights) ? job.highlights as string[] : [],
  };
}

function mapLearningToEducation(learning: LearningRow): MappedEducation {
  // Map learning types to study types
  const studyTypeMap: Record<string, string> = {
    degree: "Bachelor",
    certification: "Certification",
    course: "Course",
    workshop: "Workshop",
    conference: "Conference",
  };

  const learningType = String(learning.learningType);

  return {
    sourceId: learning.id,
    institution: learning.provider || "Self-directed",
    area: learning.title,
    studyType: studyTypeMap[learningType] || learningType,
    startDate: learning.startDate ? new Date(learning.startDate as unknown as string) : null,
    endDate: learning.completionDate ? new Date(learning.completionDate as unknown as string) : null,
  };
}

function mapCmosSkillToProfile(skill: SkillRow): MappedSkill {
  // Map proficiency to level
  const levelMap: Record<string, string> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
    expert: "expert",
  };

  const proficiency = String(skill.proficiency);

  return {
    sourceId: skill.id,
    name: skill.name,
    category: skill.category,
    level: levelMap[proficiency] || proficiency,
    keywords: Array.isArray(skill.keywords) ? skill.keywords as string[] : [],
  };
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

function normalizeString(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function isDuplicateWork(
  mapped: MappedWork,
  existing: { company: string; position: string }[]
): boolean {
  const normalizedCompany = normalizeString(mapped.company);
  const normalizedPosition = normalizeString(mapped.position);
  
  return existing.some(
    (e) =>
      normalizeString(e.company) === normalizedCompany &&
      normalizeString(e.position) === normalizedPosition
  );
}

function isDuplicateEducation(
  mapped: MappedEducation,
  existing: { institution: string; area?: string | null }[]
): boolean {
  const normalizedInstitution = normalizeString(mapped.institution);
  const normalizedArea = mapped.area ? normalizeString(mapped.area) : "";
  
  return existing.some(
    (e) =>
      normalizeString(e.institution) === normalizedInstitution &&
      (e.area ? normalizeString(e.area) : "") === normalizedArea
  );
}

function isDuplicateSkill(
  mapped: MappedSkill,
  existing: { name: string }[]
): boolean {
  const normalizedName = normalizeString(mapped.name);
  return existing.some((e) => normalizeString(e.name) === normalizedName);
}

// ============================================================================
// MAIN POPULATE FUNCTION
// ============================================================================

export async function populateFromCareer(
  db: Kysely<DB>,
  options: PopulateOptions
): Promise<PopulateResult> {
  const {
    workspaceId,
    profileId,
    dryRun = false,
    mode = "merge",
    includeJobs = true,
    includeLearning = true,
    includeSkills = true,
  } = options;

  const result: PopulateResult = {
    success: true,
    dryRun,
    workCreated: 0,
    workSkipped: 0,
    educationCreated: 0,
    educationSkipped: 0,
    skillsCreated: 0,
    skillsSkipped: 0,
    errors: [],
  };

  const preview: PopulatePreview = {
    workToCreate: [],
    educationToCreate: [],
    skillsToCreate: [],
  };

  try {
    // Fetch existing profile data for duplicate detection
    const existingWork = mode === "merge"
      ? await db
          .selectFrom("workExperiences")
          .select(["company", "position"])
          .where("profileId", "=", profileId)
          .execute()
      : [];

    const existingEducation = mode === "merge"
      ? await db
          .selectFrom("educationEntries")
          .select(["institution", "area"])
          .where("profileId", "=", profileId)
          .execute()
      : [];

    const existingSkills = mode === "merge"
      ? await db
          .selectFrom("skills")
          .select(["name"])
          .where("profileId", "=", profileId)
          .execute()
      : [];

    // Process Jobs → Work Experiences
    if (includeJobs) {
      const jobs = await db
        .selectFrom("jobs")
        .selectAll()
        .where("workspaceId", "=", workspaceId)
        .orderBy("startDate", "desc")
        .execute();

      for (const job of jobs) {
        try {
          const mapped = mapJobToWork(job);
          
          if (isDuplicateWork(mapped, existingWork)) {
            result.workSkipped++;
            continue;
          }

          preview.workToCreate.push(mapped);
          result.workCreated++;
        } catch (e) {
          result.errors.push({
            source: "jobs",
            sourceId: job.id,
            message: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    }

    // Process Learning → Education Entries
    if (includeLearning) {
      const learnings = await db
        .selectFrom("learning")
        .selectAll()
        .where("workspaceId", "=", workspaceId)
        .orderBy("startDate", "desc")
        .execute();

      for (const learning of learnings) {
        try {
          const mapped = mapLearningToEducation(learning);
          
          if (isDuplicateEducation(mapped, existingEducation)) {
            result.educationSkipped++;
            continue;
          }

          preview.educationToCreate.push(mapped);
          result.educationCreated++;
        } catch (e) {
          result.errors.push({
            source: "learning",
            sourceId: learning.id,
            message: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    }

    // Process Skills
    if (includeSkills) {
      const cmosSkills = await db
        .selectFrom("skills")
        .selectAll()
        .where("workspaceId", "=", workspaceId)
        .where("profileId", "is", null) // Only CMOS skills (not already profile skills)
        .execute();

      for (const skill of cmosSkills) {
        try {
          const mapped = mapCmosSkillToProfile(skill);
          
          if (isDuplicateSkill(mapped, existingSkills)) {
            result.skillsSkipped++;
            continue;
          }

          preview.skillsToCreate.push(mapped);
          result.skillsCreated++;
        } catch (e) {
          result.errors.push({
            source: "skills",
            sourceId: skill.id,
            message: e instanceof Error ? e.message : "Unknown error",
          });
        }
      }
    }

    // If dry run, return preview without persisting
    if (dryRun) {
      result.preview = preview;
      return result;
    }

    // Persist to database
    if (mode === "replace") {
      // Delete existing data first
      await db.deleteFrom("workExperiences").where("profileId", "=", profileId).execute();
      await db.deleteFrom("educationEntries").where("profileId", "=", profileId).execute();
      await db.deleteFrom("skills").where("profileId", "=", profileId).execute();
    }

    // Insert work experiences
    for (const work of preview.workToCreate) {
      const id = nanoid();
      await db
        .insertInto("workExperiences")
        .values({
          id,
          profileId,
          company: work.company,
          position: work.position,
          startDate: work.startDate,
          endDate: work.endDate,
          summary: work.summary,
          highlights: work.highlights as unknown as null,
        })
        .execute();

      // Create provenance link
      await db
        .insertInto("provenanceLinks")
        .values({
          id: nanoid(),
          workspaceId,
          targetTable: "workExperiences",
          targetId: id,
          targetField: null,
          sourceType: "cmos_jobs",
          sourceArtifactId: null,
          sourceDate: new Date(),
          confidence: "high",
          notes: `Populated from CMOS job: ${work.sourceId}`,
        })
        .execute();
    }

    // Insert education entries
    for (const edu of preview.educationToCreate) {
      const id = nanoid();
      await db
        .insertInto("educationEntries")
        .values({
          id,
          profileId,
          institution: edu.institution,
          area: edu.area,
          studyType: edu.studyType,
          startDate: edu.startDate,
          endDate: edu.endDate,
        })
        .execute();

      // Create provenance link
      await db
        .insertInto("provenanceLinks")
        .values({
          id: nanoid(),
          workspaceId,
          targetTable: "educationEntries",
          targetId: id,
          targetField: null,
          sourceType: "cmos_learning",
          sourceArtifactId: null,
          sourceDate: new Date(),
          confidence: "high",
          notes: `Populated from CMOS learning: ${edu.sourceId}`,
        })
        .execute();
    }

    // Insert skills (linked to profile)
    for (const skill of preview.skillsToCreate) {
      const id = nanoid();
      await db
        .insertInto("skills")
        .values({
          id,
          workspaceId,
          profileId,
          name: skill.name,
          category: skill.category,
          level: skill.level,
          keywords: skill.keywords as unknown as null,
          proficiency: "intermediate", // Default for migrated skills
        })
        .execute();

      // Create provenance link
      await db
        .insertInto("provenanceLinks")
        .values({
          id: nanoid(),
          workspaceId,
          targetTable: "skills",
          targetId: id,
          targetField: null,
          sourceType: "cmos_skills",
          sourceArtifactId: null,
          sourceDate: new Date(),
          confidence: "high",
          notes: `Populated from CMOS skill: ${skill.sourceId}`,
        })
        .execute();
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push({
      source: "jobs",
      sourceId: "system",
      message: error instanceof Error ? error.message : "Unknown system error",
    });
    return result;
  }
}
