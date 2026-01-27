/**
 * LinkedIn ZIP Parser
 * 
 * Parses LinkedIn data export ZIP files and maps records to TellDoug entities.
 * Supports hierarchical entity mapping where one LinkedIn record may create
 * multiple related entities (e.g., Position → Job + Institution).
 */

import JSZip from "jszip";
import Papa from "papaparse";
import { nanoid } from "nanoid";

// ============================================================================
// Types
// ============================================================================

export type LinkedInRecordType =
  | "profile"
  | "position"
  | "education"
  | "skill"
  | "project"
  | "connection"
  | "certification"
  | "endorsement";

export type TellDougEntityType =
  | "profile"
  | "job"
  | "learning"
  | "skill"
  | "project"
  | "person"
  | "relationship"
  | "achievement"
  | "institution";

export interface EntityMapping {
  primary: TellDougEntityType;
  secondary?: TellDougEntityType[];
  data: Record<string, unknown>;
  secondaryData?: Record<string, unknown>[];
}

export interface ParsedRecord {
  id: string;
  recordType: LinkedInRecordType;
  sourceData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  entityMappings: EntityMapping;
  fingerprint: string; // For dedup detection
}

export interface ParseResult {
  success: boolean;
  records: ParsedRecord[];
  errors: string[];
  stats: {
    totalFiles: number;
    parsedFiles: number;
    totalRecords: number;
    byType: Record<LinkedInRecordType, number>;
  };
}

// ============================================================================
// File Detection
// ============================================================================

interface FileMapping {
  pattern: RegExp;
  type: LinkedInRecordType;
  requiredHeaders?: string[];
}

const FILE_MAPPINGS: FileMapping[] = [
  {
    pattern: /profile\.csv$/i,
    type: "profile",
    requiredHeaders: ["First Name", "Last Name"],
  },
  {
    pattern: /positions\.csv$/i,
    type: "position",
    requiredHeaders: ["Company Name", "Title"],
  },
  {
    pattern: /education\.csv$/i,
    type: "education",
    requiredHeaders: ["School Name"],
  },
  {
    pattern: /skills\.csv$/i,
    type: "skill",
    requiredHeaders: ["Name"],
  },
  {
    pattern: /projects\.csv$/i,
    type: "project",
    requiredHeaders: ["Title"],
  },
  {
    pattern: /connections\.csv$/i,
    type: "connection",
    requiredHeaders: ["First Name", "Last Name"],
  },
  {
    pattern: /certifications\.csv$/i,
    type: "certification",
    requiredHeaders: ["Name"],
  },
  {
    pattern: /endorsement.*received.*\.csv$/i,
    type: "endorsement",
    requiredHeaders: ["Skill Name"],
  },
];

function detectFileType(filename: string, headers: string[]): LinkedInRecordType | null {
  for (const mapping of FILE_MAPPINGS) {
    if (mapping.pattern.test(filename)) {
      // Check required headers if specified
      if (mapping.requiredHeaders) {
        const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
        const hasRequired = mapping.requiredHeaders.every((req) =>
          normalizedHeaders.some((h) => h.includes(req.toLowerCase()))
        );
        if (hasRequired) {
          return mapping.type;
        }
      } else {
        return mapping.type;
      }
    }
  }
  return null;
}

/**
 * Skips preamble lines in LinkedIn CSV files (especially Connections.csv).
 * LinkedIn exports sometimes include notes/info lines before the header row.
 * Returns the content starting from the header row.
 */
function skipPreambleLines(content: string, filename: string): string {
  // Only process files known to have preambles (mainly Connections.csv)
  if (!/connections\.csv$/i.test(filename)) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  
  // Look for the header row by finding a line that starts with known headers
  // Connections.csv header typically starts with "First Name"
  const headerPatterns = [
    /^"?First Name"?,/i,
    /^First Name,/i,
  ];

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].trim();
    if (headerPatterns.some(pattern => pattern.test(line))) {
      // Found header, return from here
      return lines.slice(i).join('\n');
    }
  }

  // No preamble detected, return original
  return content;
}

// ============================================================================
// Data Parsing Helpers
// ============================================================================

function parseCSVDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) {return null;}

  // LinkedIn uses various formats: "Jan 2020", "2020", "01/2020", etc.
  const str = dateStr.trim();

  // Try ISO format first
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(str)) {
    return str.length === 7 ? `${str}-01` : str;
  }

  // Month Year format: "Jan 2020" or "January 2020"
  const monthYearMatch = str.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i
  );
  if (monthYearMatch) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const month = months[monthYearMatch[1].toLowerCase().slice(0, 3)];
    return `${monthYearMatch[2]}-${month}-01`;
  }

  // Just year: "2020"
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }

  // MM/YYYY format
  const mmYYYYMatch = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYYMatch) {
    const month = mmYYYYMatch[1].padStart(2, "0");
    return `${mmYYYYMatch[2]}-${month}-01`;
  }

  return null;
}

function cleanString(str: string | null | undefined): string {
  if (!str) {return "";}
  return str.trim().replace(/\s+/g, " ");
}

function generateFingerprint(type: LinkedInRecordType, data: Record<string, unknown>): string {
  // Create a stable fingerprint for deduplication
  const parts: string[] = [type];

  switch (type) {
    case "position":
      parts.push(
        cleanString(data["Company Name"] as string).toLowerCase(),
        cleanString(data["Title"] as string).toLowerCase(),
        parseCSVDate(data["Started On"] as string) || ""
      );
      break;
    case "education":
      parts.push(
        cleanString(data["School Name"] as string).toLowerCase(),
        cleanString(data["Degree Name"] as string).toLowerCase()
      );
      break;
    case "skill":
      parts.push(cleanString(data["Name"] as string).toLowerCase());
      break;
    case "project":
      parts.push(cleanString(data["Title"] as string).toLowerCase());
      break;
    case "connection":
      parts.push(
        cleanString(data["First Name"] as string).toLowerCase(),
        cleanString(data["Last Name"] as string).toLowerCase(),
        cleanString(data["Email Address"] as string).toLowerCase()
      );
      break;
    case "certification":
      parts.push(
        cleanString(data["Name"] as string).toLowerCase(),
        cleanString(data["Authority"] as string).toLowerCase()
      );
      break;
    case "profile":
      parts.push(
        cleanString(data["First Name"] as string).toLowerCase(),
        cleanString(data["Last Name"] as string).toLowerCase()
      );
      break;
    case "endorsement":
      parts.push(
        cleanString(data["Skill Name"] as string).toLowerCase(),
        cleanString(data["Endorser First Name"] as string).toLowerCase()
      );
      break;
  }

  return parts.filter(Boolean).join("|");
}

// ============================================================================
// Entity Mapping Functions
// ============================================================================

function mapPosition(data: Record<string, unknown>): EntityMapping {
  const companyName = cleanString(data["Company Name"] as string);
  const title = cleanString(data["Title"] as string);
  const location = cleanString(data["Location"] as string);
  const description = cleanString(data["Description"] as string);
  const startDate = parseCSVDate(data["Started On"] as string);
  const endDate = parseCSVDate(data["Finished On"] as string);

  return {
    primary: "job",
    secondary: companyName ? ["institution"] : undefined,
    data: {
      company: companyName,
      title,
      location,
      description,
      startDate,
      endDate,
      isCurrent: !endDate,
      employmentType: null,
      responsibilities: description,
    },
    secondaryData: companyName
      ? [
          {
            name: companyName,
            type: "company",
            location,
          },
        ]
      : undefined,
  };
}

function mapEducation(data: Record<string, unknown>): EntityMapping {
  const schoolName = cleanString(data["School Name"] as string);
  const degreeName = cleanString(data["Degree Name"] as string);
  const fieldOfStudy = cleanString(data["Notes"] as string) || cleanString(data["Activities and Societies"] as string);
  const startDate = parseCSVDate(data["Start Date"] as string);
  const endDate = parseCSVDate(data["End Date"] as string);

  return {
    primary: "learning",
    secondary: schoolName ? ["institution"] : undefined,
    data: {
      institution: schoolName,
      title: degreeName || "Degree",
      description: fieldOfStudy,
      startDate,
      endDate,
      type: "formal_education",
      status: endDate ? "completed" : "in_progress",
    },
    secondaryData: schoolName
      ? [
          {
            name: schoolName,
            type: "educational",
          },
        ]
      : undefined,
  };
}

function mapSkill(data: Record<string, unknown>): EntityMapping {
  const name = cleanString(data["Name"] as string);

  return {
    primary: "skill",
    data: {
      name,
      category: null,
      proficiencyLevel: null,
      yearsOfExperience: null,
    },
  };
}

function mapProject(data: Record<string, unknown>): EntityMapping {
  const title = cleanString(data["Title"] as string);
  const description = cleanString(data["Description"] as string);
  const url = cleanString(data["Url"] as string);
  const startDate = parseCSVDate(data["Started On"] as string);
  const endDate = parseCSVDate(data["Finished On"] as string);

  return {
    primary: "project",
    data: {
      name: title,
      description,
      url,
      startDate,
      endDate,
      status: endDate ? "completed" : "active",
      role: null,
    },
  };
}

function mapConnection(data: Record<string, unknown>): EntityMapping {
  const firstName = cleanString(data["First Name"] as string);
  const lastName = cleanString(data["Last Name"] as string);
  const email = cleanString(data["Email Address"] as string);
  const company = cleanString(data["Company"] as string);
  const position = cleanString(data["Position"] as string);
  const connectedOn = parseCSVDate(data["Connected On"] as string);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    primary: "person",
    secondary: ["relationship"],
    data: {
      name: fullName,
      email: email || null,
      company: company || null,
      title: position || null,
      linkedinUrl: null,
      notes: null,
    },
    secondaryData: [
      {
        type: "professional_contact",
        strength: "weak",
        startDate: connectedOn,
        notes: `Connected via LinkedIn${company ? ` (${company})` : ""}`,
        context: "linkedin_connection",
      },
    ],
  };
}

function mapCertification(data: Record<string, unknown>): EntityMapping {
  const name = cleanString(data["Name"] as string);
  const authority = cleanString(data["Authority"] as string);
  const licenseNumber = cleanString(data["License Number"] as string);
  const startDate = parseCSVDate(data["Started On"] as string);
  const endDate = parseCSVDate(data["Finished On"] as string);
  const url = cleanString(data["Url"] as string);

  return {
    primary: "achievement",
    secondary: authority ? ["institution"] : undefined,
    data: {
      title: name,
      type: "certification",
      issuer: authority,
      date: startDate,
      expiryDate: endDate,
      credentialId: licenseNumber || null,
      url: url || null,
      description: null,
    },
    secondaryData: authority
      ? [
          {
            name: authority,
            type: "certification_authority",
          },
        ]
      : undefined,
  };
}

function mapProfile(data: Record<string, unknown>): EntityMapping {
  const firstName = cleanString(data["First Name"] as string);
  const lastName = cleanString(data["Last Name"] as string);
  const headline = cleanString(data["Headline"] as string);
  const summary = cleanString(data["Summary"] as string);
  const location = cleanString(data["Geo Location"] as string) || cleanString(data["Location"] as string);
  const industry = cleanString(data["Industry"] as string);

  return {
    primary: "profile",
    data: {
      firstName,
      lastName,
      displayName: [firstName, lastName].filter(Boolean).join(" "),
      headline,
      summary,
      location,
      industry,
    },
  };
}

function mapEndorsement(data: Record<string, unknown>): EntityMapping {
  const skillName = cleanString(data["Skill Name"] as string);
  const endorserFirstName = cleanString(data["Endorser First Name"] as string);
  const endorserLastName = cleanString(data["Endorser Last Name"] as string);
  const _endorsementDate = parseCSVDate(data["Endorsement Date"] as string);

  const endorserName = [endorserFirstName, endorserLastName].filter(Boolean).join(" ");

  return {
    primary: "skill",
    secondary: endorserName ? ["person"] : undefined,
    data: {
      name: skillName,
      // Endorsement increases confidence/proficiency
      endorsementCount: 1,
    },
    secondaryData: endorserName
      ? [
          {
            name: endorserName,
            notes: `Endorsed skill: ${skillName}`,
          },
        ]
      : undefined,
  };
}

function mapRecord(type: LinkedInRecordType, data: Record<string, unknown>): EntityMapping {
  switch (type) {
    case "position":
      return mapPosition(data);
    case "education":
      return mapEducation(data);
    case "skill":
      return mapSkill(data);
    case "project":
      return mapProject(data);
    case "connection":
      return mapConnection(data);
    case "certification":
      return mapCertification(data);
    case "profile":
      return mapProfile(data);
    case "endorsement":
      return mapEndorsement(data);
    default:
      return {
        primary: "profile",
        data: data,
      };
  }
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a LinkedIn data export ZIP file
 */
export async function parseLinkedInZip(file: File | ArrayBuffer): Promise<ParseResult> {
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  const stats = {
    totalFiles: 0,
    parsedFiles: 0,
    totalRecords: 0,
    byType: {} as Record<LinkedInRecordType, number>,
  };

  try {
    // Load ZIP file
    const zip = await JSZip.loadAsync(file);
    const files = Object.values(zip.files).filter(
      (f) => !f.dir && f.name.endsWith(".csv")
    );

    stats.totalFiles = files.length;

    // Process each CSV file
    for (const zipFile of files) {
      try {
        let content = await zipFile.async("string");

        // Skip preamble lines for files that have them (e.g., Connections.csv)
        content = skipPreambleLines(content, zipFile.name);

        // Parse CSV
        const parsed = Papa.parse<Record<string, unknown>>(content, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });

        if (parsed.errors.length > 0) {
          errors.push(
            `Errors parsing ${zipFile.name}: ${parsed.errors
              .slice(0, 3)
              .map((e) => e.message)
              .join(", ")}`
          );
        }

        if (!parsed.data.length) {continue;}

        // Detect file type
        const headers = parsed.meta.fields || [];
        const recordType = detectFileType(zipFile.name, headers);

        if (!recordType) {
          errors.push(`Could not determine type for file: ${zipFile.name}`);
          continue;
        }

        stats.parsedFiles++;
        stats.byType[recordType] = (stats.byType[recordType] || 0) + parsed.data.length;

        // Map each row to a ParsedRecord
        for (const row of parsed.data) {
          // Skip empty rows
          const hasData = Object.values(row).some(
            (v) => v !== null && v !== undefined && String(v).trim() !== ""
          );
          if (!hasData) {continue;}

          const entityMappings = mapRecord(recordType, row);
          const fingerprint = generateFingerprint(recordType, row);

          records.push({
            id: nanoid(),
            recordType,
            sourceData: row,
            mappedData: entityMappings.data,
            entityMappings,
            fingerprint,
          });

          stats.totalRecords++;
        }
      } catch (fileError) {
        errors.push(
          `Failed to process ${zipFile.name}: ${
            fileError instanceof Error ? fileError.message : "Unknown error"
          }`
        );
      }
    }

    return {
      success: records.length > 0,
      records,
      errors,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      errors: [
        `Failed to parse ZIP file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
      stats,
    };
  }
}

/**
 * Parse a single CSV file (for individual file uploads)
 */
export async function parseLinkedInCSV(
  content: string,
  filename: string
): Promise<ParseResult> {
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  const stats = {
    totalFiles: 1,
    parsedFiles: 0,
    totalRecords: 0,
    byType: {} as Record<LinkedInRecordType, number>,
  };

  try {
    const parsed = Papa.parse<Record<string, unknown>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors.length > 0) {
      errors.push(
        `Errors parsing CSV: ${parsed.errors
          .slice(0, 3)
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    if (!parsed.data.length) {
      return {
        success: false,
        records: [],
        errors: ["CSV file is empty or has no data rows"],
        stats,
      };
    }

    const headers = parsed.meta.fields || [];
    const recordType = detectFileType(filename, headers);

    if (!recordType) {
      // Try to auto-detect from headers
      return {
        success: false,
        records: [],
        errors: [
          `Could not determine file type. Expected LinkedIn export file (Positions.csv, Education.csv, etc.)`,
        ],
        stats,
      };
    }

    stats.parsedFiles = 1;
    stats.byType[recordType] = parsed.data.length;

    for (const row of parsed.data) {
      const hasData = Object.values(row).some(
        (v) => v !== null && v !== undefined && String(v).trim() !== ""
      );
      if (!hasData) {continue;}

      const entityMappings = mapRecord(recordType, row);
      const fingerprint = generateFingerprint(recordType, row);

      records.push({
        id: nanoid(),
        recordType,
        sourceData: row,
        mappedData: entityMappings.data,
        entityMappings,
        fingerprint,
      });

      stats.totalRecords++;
    }

    return {
      success: records.length > 0,
      records,
      errors,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      records: [],
      errors: [
        `Failed to parse CSV: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
      stats,
    };
  }
}

// ============================================================================
// Utility Exports
// ============================================================================

export const SUPPORTED_FILE_TYPES = FILE_MAPPINGS.map((m) => m.type);

export function getRecordTypeLabel(type: LinkedInRecordType): string {
  const labels: Record<LinkedInRecordType, string> = {
    profile: "Profile",
    position: "Work Experience",
    education: "Education",
    skill: "Skill",
    project: "Project",
    connection: "Connection",
    certification: "Certification",
    endorsement: "Endorsement",
  };
  return labels[type] || type;
}

export function getEntityTypeLabel(type: TellDougEntityType): string {
  const labels: Record<TellDougEntityType, string> = {
    profile: "Profile",
    job: "Job",
    learning: "Education",
    skill: "Skill",
    project: "Project",
    person: "Person",
    relationship: "Relationship",
    achievement: "Achievement",
    institution: "Institution",
  };
  return labels[type] || type;
}

export function getRecordTypeIcon(type: LinkedInRecordType): string {
  const icons: Record<LinkedInRecordType, string> = {
    profile: "👤",
    position: "💼",
    education: "🎓",
    skill: "💡",
    project: "📁",
    connection: "🤝",
    certification: "🏆",
    endorsement: "👍",
  };
  return icons[type] || "📄";
}
