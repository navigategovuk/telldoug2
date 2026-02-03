/**
 * Profile Types for Resume Builder
 * 
 * These interfaces define the shape of profile data used throughout
 * the resume system. They align with the JSON Resume schema for
 * export compatibility while supporting telldoug-specific features.
 */

// ============================================================================
// PROFILE BASICS
// ============================================================================

export interface ProfileLocation {
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface SocialProfile {
  network: string;
  username?: string;
  url?: string;
}

export interface ProfileBasics {
  id: string;
  workspaceId: string;
  fullName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  label?: string | null;
  email?: string | null;
  phone?: string | null;
  url?: string | null;
  summary?: string | null;
  location?: ProfileLocation | null;
  socialProfiles?: SocialProfile[] | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ============================================================================
// WORK EXPERIENCE
// ============================================================================

export interface WorkExperience {
  id: string;
  profileId: string;
  company: string;
  position: string;
  department?: string | null;
  employmentType?: string | null;
  url?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  summary?: string | null;
  highlights?: string[] | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type EmploymentType = 
  | "full-time"
  | "part-time"
  | "contract"
  | "freelance"
  | "internship"
  | "volunteer";

// ============================================================================
// EDUCATION
// ============================================================================

export interface EducationEntry {
  id: string;
  profileId: string;
  institution: string;
  area?: string | null;
  studyType?: string | null;
  degreeType?: string | null;
  minor?: string | null;
  url?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  score?: string | null;
  courses?: string[] | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type DegreeType =
  | "high-school"
  | "associate"
  | "bachelor"
  | "master"
  | "doctorate"
  | "certificate"
  | "bootcamp"
  | "other";

// ============================================================================
// SKILLS
// ============================================================================

export interface ProfileSkill {
  id: string;
  profileId: string;
  name: string;
  category?: string | null;
  level?: SkillLevel | null;
  keywords?: string[] | null;
  yearsOfExperience?: number | null;
  lastUsedDate?: Date | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

// ============================================================================
// PROJECTS
// ============================================================================

export interface ProfileProject {
  id: string;
  profileId: string;
  name: string;
  description?: string | null;
  url?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  highlights?: string[] | null;
  keywords?: string[] | null;
  roles?: string[] | null;
  entity?: string | null;
  type?: string | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export interface ProfileCertification {
  id: string;
  profileId: string;
  name: string;
  issuer: string;
  date?: Date | null;
  expirationDate?: Date | null;
  url?: string | null;
  credentialId?: string | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ============================================================================
// AWARDS
// ============================================================================

export interface ProfileAward {
  id: string;
  profileId: string;
  title: string;
  awarder?: string | null;
  date?: Date | null;
  summary?: string | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ============================================================================
// LANGUAGES
// ============================================================================

export interface ProfileLanguage {
  id: string;
  profileId: string;
  language: string;
  fluency?: LanguageFluency | null;
  sortOrder?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type LanguageFluency =
  | "elementary"
  | "limited-working"
  | "professional-working"
  | "full-professional"
  | "native";

// ============================================================================
// COMPLETE PROFILE (Aggregated)
// ============================================================================

export interface CompleteProfile {
  basics: ProfileBasics;
  work: WorkExperience[];
  education: EducationEntry[];
  skills: ProfileSkill[];
  projects: ProfileProject[];
  certifications: ProfileCertification[];
  awards: ProfileAward[];
  languages: ProfileLanguage[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ProfileCreateInput {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  label?: string;
  summary?: string;
  location?: ProfileLocation;
}

export interface ProfileUpdateInput extends Partial<ProfileCreateInput> {
  middleName?: string;
  url?: string;
  socialProfiles?: SocialProfile[];
}

export interface WorkExperienceInput {
  company: string;
  position: string;
  department?: string;
  employmentType?: EmploymentType;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface EducationInput {
  institution: string;
  area?: string;
  studyType?: string;
  degreeType?: DegreeType;
  minor?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface SkillInput {
  name: string;
  category?: string;
  level?: SkillLevel;
  keywords?: string[];
  yearsOfExperience?: number;
}

export interface ProjectInput {
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
  keywords?: string[];
  roles?: string[];
  entity?: string;
  type?: string;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface ProfileQueryOptions {
  workspaceId: string;
  includeWork?: boolean;
  includeEducation?: boolean;
  includeSkills?: boolean;
  includeProjects?: boolean;
  includeCertifications?: boolean;
  includeAwards?: boolean;
  includeLanguages?: boolean;
}

export interface ProfileSectionReorderInput {
  section: "work" | "education" | "skills" | "projects" | "certifications" | "awards" | "languages";
  orderedIds: string[];
}
