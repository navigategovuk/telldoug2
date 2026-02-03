import { format } from "date-fns";

// --- Interfaces ---

export interface ResumeBasics {
  name?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: {
    address?: string;
    postalCode?: string;
    city?: string;
    countryCode?: string;
    region?: string;
  };
  profiles?: Array<{
    network?: string;
    username?: string;
    url?: string;
  }>;
}

export interface ResumeWork {
  name?: string; // Company name
  position?: string;
  department?: string;
  employmentType?: string;
  url?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  summary?: string;
  highlights?: string[];
}

export interface ResumeEducation {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  degreeType?: string;
  minor?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface ResumeSkill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface ResumeProject {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface ResumeData {
  basics?: ResumeBasics;
  work?: ResumeWork[];
  education?: ResumeEducation[];
  skills?: ResumeSkill[];
  projects?: ResumeProject[];
  meta?: {
    canonical?: string;
    version?: string;
    lastModified?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ExportOptions {
  versionSnapshotId?: string;
  generatedAt: Date;
  provenanceSummary?: string[];
  variantName?: string;
  includeMetadata?: boolean;
}

export interface ExportResult {
  buffer?: Blob | Uint8Array;
  content?: string;
  filename: string;
  mimeType: string;
}

// --- Helper Functions ---

/**
 * Generates a sanitized filename based on user name, variant, and date.
 */
export function getFilename(
  baseName: string,
  extension: string,
  variantName?: string
): string {
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const safeBase = (baseName || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
  const safeVariant = variantName
    ? `-${variantName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
    : "";

  return `${safeBase}${safeVariant}-${dateStr}.${extension.replace(/^\./, "")}`;
}

/**
 * Formats a date range string (e.g., "Jan 2020 - Present" or "Jan 2020 - Dec 2021").
 * Expects YYYY-MM-DD strings or Date objects.
 */
export function formatDateRange(
  start?: string | Date | null,
  end?: string | Date | null
): string {
  if (!start) {return "";}

  const startDate = typeof start === "string" ? new Date(start) : start;
  const startStr = isValidDate(startDate) ? format(startDate, "MMM yyyy") : "";

  if (!end) {
    return `${startStr} - Present`;
  }

  const endDate = typeof end === "string" ? new Date(end) : end;
  const endStr = isValidDate(endDate) ? format(endDate, "MMM yyyy") : "Present";

  return `${startStr} - ${endStr}`;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}
