/**
 * View Definition Presets for Resume Variants
 *
 * These presets define which sections and fields to include when rendering
 * a resume variant. They are seeded on workspace creation.
 */

/**
 * Section visibility configuration
 */
export interface ViewSectionConfig {
  visible: boolean;
  maxItems?: number;
  fields?: string[];
}

/**
 * Complete view definition structure
 */
export interface ViewDefinition {
  id: string;
  name: string;
  description: string;
  category: "professional" | "executive" | "media" | "academic";
  sections: {
    basics: ViewSectionConfig;
    summary: ViewSectionConfig;
    work: ViewSectionConfig;
    education: ViewSectionConfig;
    skills: ViewSectionConfig;
    projects: ViewSectionConfig;
    certifications: ViewSectionConfig;
    publications: ViewSectionConfig;
    awards: ViewSectionConfig;
    volunteer: ViewSectionConfig;
    languages: ViewSectionConfig;
    interests: ViewSectionConfig;
  };
  formatting: {
    dateFormat: "full" | "monthYear" | "yearOnly";
    includeUrls: boolean;
    includeLocation: boolean;
    highlightLimit?: number;
  };
}

/**
 * Default section configuration (all visible)
 */
const defaultSections: ViewDefinition["sections"] = {
  basics: { visible: true },
  summary: { visible: true },
  work: { visible: true },
  education: { visible: true },
  skills: { visible: true },
  projects: { visible: true },
  certifications: { visible: true },
  publications: { visible: false },
  awards: { visible: true },
  volunteer: { visible: false },
  languages: { visible: true },
  interests: { visible: false },
};

/**
 * LinkedIn-style professional resume
 * - Full contact info
 * - Comprehensive work history
 * - All skills visible
 */
export const linkedinStylePreset: ViewDefinition = {
  id: "linkedin-style",
  name: "LinkedIn Style",
  description: "Comprehensive professional resume similar to LinkedIn profile format",
  category: "professional",
  sections: {
    ...defaultSections,
    work: { visible: true },
    education: { visible: true },
    skills: { visible: true },
    projects: { visible: true },
    certifications: { visible: true },
    volunteer: { visible: true },
    languages: { visible: true },
    interests: { visible: true },
  },
  formatting: {
    dateFormat: "monthYear",
    includeUrls: true,
    includeLocation: true,
  },
};

/**
 * Long-form CV for academic or detailed applications
 * - Complete history without limits
 * - Includes publications and awards
 */
export const longFormCvPreset: ViewDefinition = {
  id: "long-form-cv",
  name: "Long-Form CV",
  description: "Comprehensive curriculum vitae with complete history",
  category: "academic",
  sections: {
    ...defaultSections,
    work: { visible: true },
    education: { visible: true },
    skills: { visible: true },
    projects: { visible: true },
    certifications: { visible: true },
    publications: { visible: true },
    awards: { visible: true },
    volunteer: { visible: true },
    languages: { visible: true },
    interests: { visible: true },
  },
  formatting: {
    dateFormat: "monthYear",
    includeUrls: true,
    includeLocation: true,
  },
};

/**
 * One-page resume for quick applications
 * - Limited to most recent/relevant items
 * - Condensed formatting
 */
export const onePageCvPreset: ViewDefinition = {
  id: "one-page-cv",
  name: "One-Page Resume",
  description: "Condensed single-page resume for quick review",
  category: "professional",
  sections: {
    ...defaultSections,
    work: { visible: true, maxItems: 3 },
    education: { visible: true, maxItems: 2 },
    skills: { visible: true },
    projects: { visible: true, maxItems: 2 },
    certifications: { visible: false },
    publications: { visible: false },
    awards: { visible: false },
    volunteer: { visible: false },
    languages: { visible: false },
    interests: { visible: false },
  },
  formatting: {
    dateFormat: "yearOnly",
    includeUrls: false,
    includeLocation: false,
    highlightLimit: 3,
  },
};

/**
 * Executive bio for leadership positions
 * - Focus on high-level achievements
 * - Board/leadership emphasis
 */
export const executiveBioPreset: ViewDefinition = {
  id: "executive-bio-short",
  name: "Executive Bio",
  description: "Brief executive biography highlighting leadership achievements",
  category: "executive",
  sections: {
    ...defaultSections,
    summary: { visible: true },
    work: { visible: true, maxItems: 4 },
    education: { visible: true, maxItems: 2 },
    skills: { visible: false },
    projects: { visible: false },
    certifications: { visible: false },
    publications: { visible: false },
    awards: { visible: true, maxItems: 3 },
    volunteer: { visible: false },
    languages: { visible: false },
    interests: { visible: false },
  },
  formatting: {
    dateFormat: "yearOnly",
    includeUrls: false,
    includeLocation: false,
    highlightLimit: 2,
  },
};

/**
 * Media/press bio for public appearances
 * - Third-person narrative style
 * - Public-facing information only
 */
export const mediaBioPreset: ViewDefinition = {
  id: "media-bio",
  name: "Media Bio",
  description: "Public-facing biography for press and media appearances",
  category: "media",
  sections: {
    ...defaultSections,
    basics: { visible: true, fields: ["name", "label", "url"] },
    summary: { visible: true },
    work: { visible: true, maxItems: 3 },
    education: { visible: true, maxItems: 1 },
    skills: { visible: false },
    projects: { visible: false },
    certifications: { visible: false },
    publications: { visible: true },
    awards: { visible: true, maxItems: 3 },
    volunteer: { visible: false },
    languages: { visible: false },
    interests: { visible: false },
  },
  formatting: {
    dateFormat: "yearOnly",
    includeUrls: true,
    includeLocation: false,
  },
};

/**
 * Website bio for personal portfolio
 * - Friendly, approachable tone
 * - Includes interests and personal info
 */
export const websiteBioPreset: ViewDefinition = {
  id: "website-bio",
  name: "Website Bio",
  description: "Personal biography for portfolio websites and about pages",
  category: "media",
  sections: {
    ...defaultSections,
    basics: { visible: true },
    summary: { visible: true },
    work: { visible: true, maxItems: 3 },
    education: { visible: true, maxItems: 2 },
    skills: { visible: true },
    projects: { visible: true, maxItems: 4 },
    certifications: { visible: false },
    publications: { visible: false },
    awards: { visible: false },
    volunteer: { visible: true, maxItems: 2 },
    languages: { visible: true },
    interests: { visible: true },
  },
  formatting: {
    dateFormat: "yearOnly",
    includeUrls: true,
    includeLocation: false,
  },
};

/**
 * All preset definitions
 */
export const VIEW_DEFINITION_PRESETS: ViewDefinition[] = [
  linkedinStylePreset,
  longFormCvPreset,
  onePageCvPreset,
  executiveBioPreset,
  mediaBioPreset,
  websiteBioPreset,
];

/**
 * Presets to seed on workspace creation (4 recommended)
 */
export const SEED_PRESETS: ViewDefinition[] = [
  linkedinStylePreset,
  onePageCvPreset,
  executiveBioPreset,
  mediaBioPreset,
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ViewDefinition | undefined {
  return VIEW_DEFINITION_PRESETS.find((p) => p.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(
  category: ViewDefinition["category"]
): ViewDefinition[] {
  return VIEW_DEFINITION_PRESETS.filter((p) => p.category === category);
}
