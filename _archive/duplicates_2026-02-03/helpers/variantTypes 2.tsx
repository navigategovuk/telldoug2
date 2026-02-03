/**
 * Variant & Snapshot Types for Resume Builder
 * 
 * Variants represent different tailored versions of a resume.
 * Snapshots are immutable point-in-time captures for sharing/auditing.
 */

import type { Json } from "./schema";

// ============================================================================
// VIEW DEFINITIONS
// ============================================================================

export interface ViewSectionConfig {
  visible: boolean;
  maxItems?: number;
  fields?: string[];
}

export interface ViewDefinitionSections {
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
}

export interface ViewDefinitionFormatting {
  dateFormat: "full" | "monthYear" | "yearOnly";
  includeUrls: boolean;
  includeLocation: boolean;
  highlightLimit?: number;
}

export interface ViewDefinition {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  viewType?: string | null;
  rules: ViewDefinitionSections;
  redactions?: Json | null;
  isDefault?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type ViewDefinitionCategory = "professional" | "executive" | "media" | "academic";

// ============================================================================
// RESUME VARIANTS
// ============================================================================

export interface ResumeVariant {
  id: string;
  workspaceId: string;
  profileId: string;
  name: string;
  description?: string | null;
  targetRole?: string | null;
  viewDefinitionId?: string | null;
  isPrimary?: boolean | null;
  compiledData?: Json | null;
  compiledAt?: Date | null;
  canonicalDataHash?: string | null;
  lastCanonicalChange?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface VariantWithViewDefinition extends ResumeVariant {
  viewDefinition?: ViewDefinition | null;
}

// ============================================================================
// VERSION SNAPSHOTS
// ============================================================================

export interface VersionSnapshot {
  id: string;
  resumeVariantId: string;
  versionNumber: number;
  label?: string | null;
  notes?: string | null;
  snapshotData: Json;
  dataHash?: string | null;
  canonicalHash?: string | null;
  createdAt?: Date | null;
}

export interface SnapshotWithVariant extends VersionSnapshot {
  variant?: ResumeVariant | null;
}

// ============================================================================
// COMPILED DATA STRUCTURE
// ============================================================================

/**
 * The compiled data structure stored in variants and snapshots.
 * This is a denormalized, render-ready version of the profile.
 */
export interface CompiledResumeData {
  basics: {
    name: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      city?: string;
      region?: string;
      countryCode?: string;
    };
    profiles?: Array<{
      network: string;
      username?: string;
      url?: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education: Array<{
    institution: string;
    url?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
    url?: string;
  }>;
  awards?: Array<{
    title: string;
    awarder?: string;
    date?: string;
    summary?: string;
  }>;
  languages?: Array<{
    language: string;
    fluency?: string;
  }>;
  meta?: {
    version: string;
    compiledAt: string;
    variantId: string;
    variantName: string;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface VariantCreateInput {
  name: string;
  description?: string;
  targetRole?: string;
  viewDefinitionId?: string;
  isPrimary?: boolean;
}

export interface VariantUpdateInput extends Partial<VariantCreateInput> {
  compiledData?: Json;
}

export interface SnapshotCreateInput {
  label?: string;
  notes?: string;
}

export interface ViewDefinitionCreateInput {
  name: string;
  description?: string;
  viewType?: string;
  rules: ViewDefinitionSections;
  redactions?: Json;
  isDefault?: boolean;
}

export type ViewDefinitionUpdateInput = Partial<ViewDefinitionCreateInput>;

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface VariantQueryOptions {
  workspaceId: string;
  profileId?: string;
  includeViewDefinition?: boolean;
  primaryOnly?: boolean;
}

export interface SnapshotQueryOptions {
  variantId?: string;
  workspaceId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// COMPILATION HELPERS
// ============================================================================

export interface CompileVariantOptions {
  variantId: string;
  forceRecompile?: boolean;
}

export interface CompileResult {
  success: boolean;
  compiledData?: CompiledResumeData;
  hash?: string;
  error?: string;
}

// ============================================================================
// DIFF & CHANGE TRACKING
// ============================================================================

export interface VariantDiff {
  variantId: string;
  hasChanges: boolean;
  lastCompiledAt?: Date;
  lastCanonicalChange?: Date;
  changedSections: string[];
}

export interface CanonicalChangeEvent {
  workspaceId: string;
  profileId: string;
  section: string;
  action: "create" | "update" | "delete";
  itemId: string;
  timestamp: Date;
}
