/**
 * Duplicate Detection Utilities
 * 
 * Implements tiered matching algorithm for detecting potential duplicates
 * during import. Uses exact matching, fuzzy matching (Levenshtein), and
 * date overlap detection to provide confidence scores.
 */

import { distance as levenshteinDistance } from "fastest-levenshtein";
import { parseISO, isWithinInterval, addMonths, subMonths } from "date-fns";
import type { Selectable } from "kysely";
import type {
  Jobs,
  Learning,
  Skills,
  Projects,
  People,
  Achievements,
  Institutions,
} from "./schema";

// ============================================================================
// Types
// ============================================================================

export type MatchConfidence = "exact" | "likely" | "possible" | "none";

export interface DuplicateCheck {
  confidence: MatchConfidence;
  matchedId: string | null;
  matchedFields: string[];
  score: number; // 0-100
  existingRecord?: Record<string, unknown>;
}

export type EntityType =
  | "job"
  | "learning"
  | "skill"
  | "project"
  | "person"
  | "achievement"
  | "institution";

export interface NormalizedJobData {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}

export interface NormalizedLearningData {
  institution: string;
  degree: string;
  field: string;
  startDate: string | null;
  endDate: string | null;
}

export interface NormalizedSkillData {
  name: string;
  category: string | null;
}

export interface NormalizedProjectData {
  name: string;
  description: string | null;
}

export interface NormalizedPersonData {
  name: string;
  email: string | null;
  company: string | null;
}

export interface NormalizedAchievementData {
  title: string;
  issuer: string | null;
  date: string | null;
}

export interface NormalizedInstitutionData {
  name: string;
  type: string | null;
}

// ============================================================================
// Normalization Utilities
// ============================================================================

/**
 * Safely convert a date (Date object or string) to ISO string
 */
function toISOString(date: Date | string | null | undefined): string | null {
  if (!date) {return null;}
  if (typeof date === "string") {return date;}
  if (date instanceof Date) {return date.toISOString();}
  return null;
}

/**
 * Normalize a string for comparison:
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common suffixes (Inc., LLC, Corp., etc.)
 * - Trim
 */
export function normalize(str: string | null | undefined): string {
  if (!str) {return "";}

  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,?\s*(inc\.?|llc\.?|corp\.?|corporation|ltd\.?|limited|co\.?)$/i, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Calculate Levenshtein similarity ratio (0-1)
 * 1 = identical, 0 = completely different
 */
export function similarity(a: string, b: string): number {
  const normalA = normalize(a);
  const normalB = normalize(b);

  if (normalA === normalB) {return 1;}
  if (!normalA || !normalB) {return 0;}

  const maxLen = Math.max(normalA.length, normalB.length);
  if (maxLen === 0) {return 1;}

  const dist = levenshteinDistance(normalA, normalB);
  return 1 - dist / maxLen;
}

/**
 * Check if two date ranges overlap
 */
export function datesOverlap(
  start1: string | null,
  end1: string | null,
  start2: string | null,
  end2: string | null,
  toleranceMonths: number = 3
): boolean {
  if (!start1 || !start2) {return false;}

  try {
    const s1 = subMonths(parseISO(start1), toleranceMonths);
    const e1 = end1 ? addMonths(parseISO(end1), toleranceMonths) : new Date();
    const s2 = subMonths(parseISO(start2), toleranceMonths);
    const e2 = end2 ? addMonths(parseISO(end2), toleranceMonths) : new Date();

    // Check if ranges overlap
    return s1 <= e2 && s2 <= e1;
  } catch {
    return false;
  }
}

/**
 * Check if two dates are approximately equal (within tolerance)
 */
export function datesApproxEqual(
  date1: string | null,
  date2: string | null,
  toleranceMonths: number = 2
): boolean {
  if (!date1 || !date2) {return false;}

  try {
    const d1 = parseISO(date1);
    const d2 = parseISO(date2);
    const tolerance = toleranceMonths * 30 * 24 * 60 * 60 * 1000; // rough ms

    return Math.abs(d1.getTime() - d2.getTime()) <= tolerance;
  } catch {
    return false;
  }
}

// ============================================================================
// Entity-Specific Duplicate Detection
// ============================================================================

/**
 * Find duplicate jobs using tiered matching
 */
export function findJobDuplicate(
  incoming: NormalizedJobData,
  existing: Selectable<Jobs>[]
): DuplicateCheck {
  const normalizedCompany = normalize(incoming.company);
  const normalizedTitle = normalize(incoming.title);

  for (const job of existing) {
    const existingCompany = normalize(job.company);
    const existingTitle = normalize(job.title);

    // Tier 1: Exact match on company + title + start date
    if (
      existingCompany === normalizedCompany &&
      existingTitle === normalizedTitle &&
      datesApproxEqual(toISOString(job.startDate), incoming.startDate, 1)
    ) {
      return {
        confidence: "exact",
        matchedId: job.id,
        matchedFields: ["company", "title", "startDate"],
        score: 100,
        existingRecord: job as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: Fuzzy company (>0.8) + exact title + date overlap
    const companySim = similarity(job.company || "", incoming.company);
    if (
      companySim > 0.8 &&
      existingTitle === normalizedTitle &&
      datesOverlap(
        toISOString(job.startDate),
        toISOString(job.endDate),
        incoming.startDate,
        incoming.endDate
      )
    ) {
      return {
        confidence: "likely",
        matchedId: job.id,
        matchedFields: ["company", "title", "dateRange"],
        score: Math.round(70 + companySim * 15),
        existingRecord: job as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Same company (fuzzy), different role, overlapping dates
    if (
      companySim > 0.7 &&
      datesOverlap(
        toISOString(job.startDate),
        toISOString(job.endDate),
        incoming.startDate,
        incoming.endDate
      )
    ) {
      return {
        confidence: "possible",
        matchedId: job.id,
        matchedFields: ["company", "dateRange"],
        score: Math.round(50 + companySim * 10),
        existingRecord: job as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate learning/education entries
 */
export function findLearningDuplicate(
  incoming: NormalizedLearningData,
  existing: Selectable<Learning>[]
): DuplicateCheck {
  const normalizedInstitution = normalize(incoming.institution);
  const normalizedDegree = normalize(incoming.degree);
  const normalizedField = normalize(incoming.field);

  for (const entry of existing) {
    const existingInstitution = normalize(entry.provider); // Learning uses 'provider' for institution
    const existingDegree = normalize(entry.title); // Learning uses 'title' for degree
    const existingField = normalize(entry.notes); // Field often in notes

    // Tier 1: Exact match on institution + degree
    if (
      existingInstitution === normalizedInstitution &&
      existingDegree === normalizedDegree
    ) {
      return {
        confidence: "exact",
        matchedId: entry.id,
        matchedFields: ["institution", "degree"],
        score: 100,
        existingRecord: entry as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: Fuzzy institution + exact degree
    const institutionSim = similarity(entry.provider || "", incoming.institution);
    if (institutionSim > 0.8 && existingDegree === normalizedDegree) {
      return {
        confidence: "likely",
        matchedId: entry.id,
        matchedFields: ["institution", "degree"],
        score: Math.round(70 + institutionSim * 15),
        existingRecord: entry as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Same institution, overlapping dates
    if (
      institutionSim > 0.7 &&
      datesOverlap(
        entry.startDate?.toISOString() ?? null,
        entry.completionDate?.toISOString() ?? null,
        incoming.startDate,
        incoming.endDate
      )
    ) {
      return {
        confidence: "possible",
        matchedId: entry.id,
        matchedFields: ["institution", "dateRange"],
        score: Math.round(50 + institutionSim * 10),
        existingRecord: entry as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate skills
 */
export function findSkillDuplicate(
  incoming: NormalizedSkillData,
  existing: Selectable<Skills>[]
): DuplicateCheck {
  const normalizedName = normalize(incoming.name);

  for (const skill of existing) {
    const existingName = normalize(skill.name);

    // Tier 1: Exact match
    if (existingName === normalizedName) {
      return {
        confidence: "exact",
        matchedId: skill.id,
        matchedFields: ["name"],
        score: 100,
        existingRecord: skill as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: High similarity (common variations like "JavaScript" vs "Javascript")
    const nameSim = similarity(skill.name, incoming.name);
    if (nameSim > 0.9) {
      return {
        confidence: "likely",
        matchedId: skill.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 100),
        existingRecord: skill as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Moderate similarity
    if (nameSim > 0.75) {
      return {
        confidence: "possible",
        matchedId: skill.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 100),
        existingRecord: skill as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate projects
 */
export function findProjectDuplicate(
  incoming: NormalizedProjectData,
  existing: Selectable<Projects>[]
): DuplicateCheck {
  const normalizedName = normalize(incoming.name);

  for (const project of existing) {
    const existingName = normalize(project.name);

    // Tier 1: Exact name match
    if (existingName === normalizedName) {
      return {
        confidence: "exact",
        matchedId: project.id,
        matchedFields: ["name"],
        score: 100,
        existingRecord: project as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: High similarity name
    const nameSim = similarity(project.name, incoming.name);
    if (nameSim > 0.85) {
      return {
        confidence: "likely",
        matchedId: project.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 100),
        existingRecord: project as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Check description similarity if names are somewhat similar
    if (nameSim > 0.6 && incoming.description && project.description) {
      const descSim = similarity(project.description, incoming.description);
      if (descSim > 0.7) {
        return {
          confidence: "possible",
          matchedId: project.id,
          matchedFields: ["name", "description"],
          score: Math.round((nameSim * 0.4 + descSim * 0.6) * 100),
          existingRecord: project as unknown as Record<string, unknown>,
        };
      }
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate people/contacts
 */
export function findPersonDuplicate(
  incoming: NormalizedPersonData,
  existing: Selectable<People>[]
): DuplicateCheck {
  const normalizedName = normalize(incoming.name);
  const normalizedEmail = incoming.email?.toLowerCase().trim();

  for (const person of existing) {
    const existingName = normalize(person.name);
    const existingEmail = person.email?.toLowerCase().trim();

    // Tier 1: Email match (strongest signal)
    if (normalizedEmail && existingEmail && normalizedEmail === existingEmail) {
      return {
        confidence: "exact",
        matchedId: person.id,
        matchedFields: ["email"],
        score: 100,
        existingRecord: person as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: Exact name + same company
    const companySim = similarity(person.company || "", incoming.company || "");
    if (existingName === normalizedName && companySim > 0.8) {
      return {
        confidence: "likely",
        matchedId: person.id,
        matchedFields: ["name", "company"],
        score: 90,
        existingRecord: person as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: High name similarity
    const nameSim = similarity(person.name, incoming.name);
    if (nameSim > 0.9) {
      return {
        confidence: "likely",
        matchedId: person.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 90),
        existingRecord: person as unknown as Record<string, unknown>,
      };
    }

    // Tier 4: Moderate name similarity + company match
    if (nameSim > 0.7 && companySim > 0.7) {
      return {
        confidence: "possible",
        matchedId: person.id,
        matchedFields: ["name", "company"],
        score: Math.round((nameSim * 0.6 + companySim * 0.4) * 100),
        existingRecord: person as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate achievements/certifications
 */
export function findAchievementDuplicate(
  incoming: NormalizedAchievementData,
  existing: Selectable<Achievements>[]
): DuplicateCheck {
  const normalizedTitle = normalize(incoming.title);
  const normalizedIssuer = normalize(incoming.issuer);

  for (const achievement of existing) {
    const existingTitle = normalize(achievement.title);
    // Achievements schema doesn't have 'issuer' - use description as fallback
    const existingIssuer = normalize(achievement.description);

    // Tier 1: Exact title + issuer match
    if (existingTitle === normalizedTitle && existingIssuer === normalizedIssuer) {
      return {
        confidence: "exact",
        matchedId: achievement.id,
        matchedFields: ["title", "issuer"],
        score: 100,
        existingRecord: achievement as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: High title similarity + same issuer
    const titleSim = similarity(achievement.title, incoming.title);
    const issuerSim = similarity(achievement.description || "", incoming.issuer || "");
    if (titleSim > 0.85 && issuerSim > 0.8) {
      return {
        confidence: "likely",
        matchedId: achievement.id,
        matchedFields: ["title", "issuer"],
        score: Math.round((titleSim * 0.7 + issuerSim * 0.3) * 100),
        existingRecord: achievement as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Same title, different/no issuer
    if (existingTitle === normalizedTitle) {
      return {
        confidence: "possible",
        matchedId: achievement.id,
        matchedFields: ["title"],
        score: 70,
        existingRecord: achievement as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

/**
 * Find duplicate institutions
 */
export function findInstitutionDuplicate(
  incoming: NormalizedInstitutionData,
  existing: Selectable<Institutions>[]
): DuplicateCheck {
  const normalizedName = normalize(incoming.name);

  for (const institution of existing) {
    const existingName = normalize(institution.name);

    // Tier 1: Exact name match
    if (existingName === normalizedName) {
      return {
        confidence: "exact",
        matchedId: institution.id,
        matchedFields: ["name"],
        score: 100,
        existingRecord: institution as unknown as Record<string, unknown>,
      };
    }

    // Tier 2: High similarity (handles "Google" vs "Google Inc.")
    const nameSim = similarity(institution.name, incoming.name);
    if (nameSim > 0.85) {
      return {
        confidence: "likely",
        matchedId: institution.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 100),
        existingRecord: institution as unknown as Record<string, unknown>,
      };
    }

    // Tier 3: Moderate similarity
    if (nameSim > 0.7) {
      return {
        confidence: "possible",
        matchedId: institution.id,
        matchedFields: ["name"],
        score: Math.round(nameSim * 100),
        existingRecord: institution as unknown as Record<string, unknown>,
      };
    }
  }

  return { confidence: "none", matchedId: null, matchedFields: [], score: 0 };
}

// ============================================================================
// Unified Duplicate Checker
// ============================================================================

export interface DuplicateCheckRequest {
  entityType: EntityType;
  data: Record<string, unknown>;
}

/**
 * Get default user decision based on match confidence
 */
export function getDefaultDecision(
  confidence: MatchConfidence
): "create" | "merge" | "skip" {
  switch (confidence) {
    case "exact":
      return "skip";
    case "likely":
      return "merge";
    case "possible":
    case "none":
    default:
      return "create";
  }
}

/**
 * Get UI badge variant based on confidence
 */
export function getConfidenceBadgeVariant(
  confidence: MatchConfidence
): "destructive" | "warning" | "secondary" | "default" {
  switch (confidence) {
    case "exact":
      return "destructive";
    case "likely":
      return "warning";
    case "possible":
      return "secondary";
    case "none":
    default:
      return "default";
  }
}

/**
 * Get human-readable confidence label
 */
export function getConfidenceLabel(confidence: MatchConfidence): string {
  switch (confidence) {
    case "exact":
      return "Exact Match";
    case "likely":
      return "Likely Duplicate";
    case "possible":
      return "Possible Duplicate";
    case "none":
    default:
      return "New Record";
  }
}
