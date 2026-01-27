/**
 * TellDoug Unified Database Schema
 * Merged from Career Management OS and Helm Resume System
 * Generated: 2026-01-26
 */

import type { ColumnType } from "kysely";

// ============================================================================
// CMOS ENUMS - Career Management
// ============================================================================

export type AchievementCategory = "award" | "certification" | "milestone" | "promotion" | "recognition";

export type ContentType = "article" | "media_mention" | "post" | "publication" | "speaking";

export type EntityType = "event" | "institution" | "job" | "person" | "project" | "skill";

export type EventType = "conference" | "interview" | "meeting" | "networking" | "other" | "presentation" | "workshop";

export type FeedbackType = "360_feedback" | "career_coach" | "one_on_one" | "peer_feedback" | "performance_review";

export type GoalStatus = "abandoned" | "completed" | "in_progress" | "not_started";

export type GoalType = "career" | "financial" | "relationship" | "skill";

export type InstitutionType = "bootcamp" | "college" | "organization" | "other" | "school" | "university";

export type InteractionType = "call" | "coffee" | "email" | "meeting";

export type LearningStatus = "abandoned" | "completed" | "in_progress" | "planned";

export type LearningType = "certification" | "conference" | "course" | "degree" | "workshop";

export type ProjectStatus = "cancelled" | "completed" | "in_progress" | "on_hold" | "planning";

export type SkillProficiency = "advanced" | "beginner" | "expert" | "intermediate";

// ============================================================================
// HELM ENUMS - Resume Management
// ============================================================================

export type ImportStatus = "committed" | "mapped" | "merged" | "pending" | "skipped";

export type UserRole = "admin" | "owner" | "user";

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Numeric = ColumnType<string, number | string, number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

// ============================================================================
// HELM TABLES - Authentication & Workspace
// ============================================================================

export interface Users {
  avatarUrl: string | null;
  createdAt: Generated<Timestamp | null>;
  displayName: string;
  email: string;
  id: Generated<number>;
  role: Generated<UserRole>;
  updatedAt: Generated<Timestamp | null>;
}

export interface UserPasswords {
  id: Generated<number>;
  passwordHash: string;
  userId: number;
}

export interface Sessions {
  createdAt: Generated<Timestamp | null>;
  expiresAt: Timestamp;
  id: string;
  lastAccessed: Generated<Timestamp | null>;
  userId: number;
}

export interface OauthAccounts {
  createdAt: Generated<Timestamp | null>;
  id: Generated<number>;
  provider: string;
  providerEmail: string | null;
  providerUserId: string;
  updatedAt: Generated<Timestamp | null>;
  userId: number;
}

export interface OauthStates {
  codeVerifier: string;
  createdAt: Generated<Timestamp | null>;
  expiresAt: Timestamp;
  id: Generated<number>;
  provider: string;
  redirectUrl: string;
  state: string;
}

export interface LoginAttempts {
  attemptedAt: Generated<Timestamp | null>;
  email: string;
  id: Generated<number>;
  success: Generated<boolean>;
}

export interface Workspaces {
  createdAt: Generated<Timestamp | null>;
  id: Generated<string>;
  name: string;
  settings: Generated<Json | null>;
  updatedAt: Generated<Timestamp | null>;
}

export interface WorkspaceMembers {
  createdAt: Generated<Timestamp | null>;
  id: Generated<number>;
  invitedBy: number | null;
  role: Generated<string>;
  userId: number;
  workspaceId: string;
}

// ============================================================================
// HELM TABLES - Profile & Resume
// ============================================================================

export interface Profiles {
  createdAt: Generated<Timestamp | null>;
  email: string | null;
  firstName: string | null;
  fullName: string;
  id: Generated<string>;
  label: string | null;
  lastName: string | null;
  location: Json | null;
  middleName: string | null;
  phone: string | null;
  socialProfiles: Json | null;
  summary: string | null;
  updatedAt: Generated<Timestamp | null>;
  url: string | null;
  workspaceId: string | null;
}

export interface WorkExperiences {
  company: string;
  createdAt: Generated<Timestamp | null>;
  department: string | null;
  employmentType: string | null;
  endDate: Timestamp | null;
  highlights: Json | null;
  id: Generated<string>;
  position: string;
  profileId: string;
  sortOrder: Generated<number | null>;
  startDate: Timestamp | null;
  summary: string | null;
  updatedAt: Generated<Timestamp | null>;
  url: string | null;
}

export interface EducationEntries {
  area: string | null;
  courses: Json | null;
  createdAt: Generated<Timestamp | null>;
  degreeType: string | null;
  endDate: Timestamp | null;
  id: Generated<string>;
  institution: string;
  minor: string | null;
  profileId: string;
  score: string | null;
  sortOrder: Generated<number | null>;
  startDate: Timestamp | null;
  studyType: string | null;
  updatedAt: Generated<Timestamp | null>;
  url: string | null;
}

export interface ResumeVariants {
  canonicalDataHash: string | null;
  compiledAt: Timestamp | null;
  compiledData: Json | null;
  createdAt: Generated<Timestamp | null>;
  description: string | null;
  id: Generated<string>;
  isPrimary: Generated<boolean | null>;
  lastCanonicalChange: Timestamp | null;
  name: string;
  profileId: string;
  targetRole: string | null;
  updatedAt: Generated<Timestamp | null>;
  viewDefinitionId: string | null;
  workspaceId: string;
}

export interface VersionSnapshots {
  canonicalHash: string | null;
  createdAt: Generated<Timestamp | null>;
  dataHash: string | null;
  id: Generated<string>;
  label: string | null;
  notes: string | null;
  resumeVariantId: string;
  snapshotData: Json;
  versionNumber: number;
}

export interface ViewDefinitions {
  createdAt: Generated<Timestamp | null>;
  description: string | null;
  id: Generated<string>;
  isDefault: Generated<boolean | null>;
  name: string;
  redactions: Generated<Json | null>;
  rules: Generated<Json>;
  updatedAt: Generated<Timestamp | null>;
  viewType: string | null;
  workspaceId: string;
}

export interface PublicShareLinks {
  createdAt: Generated<Timestamp | null>;
  expiresAt: Timestamp | null;
  id: Generated<string>;
  isLive: Generated<boolean | null>;
  isRevoked: Generated<boolean | null>;
  label: string | null;
  lastViewedAt: Timestamp | null;
  passwordHash: string | null;
  resumeVariantId: string;
  snapshotId: string | null;
  token: string;
  viewCount: Generated<number | null>;
}

export interface QualityAnalyses {
  analyzedAt: Generated<Timestamp>;
  checklist: Generated<Json>;
  dataHash: string;
  id: Generated<string>;
  isStale: Generated<boolean | null>;
  resumeVariantId: string;
  score: number;
  snapshotId: string | null;
  warnings: Generated<Json>;
}

// ============================================================================
// HELM TABLES - Import & Provenance
// ============================================================================

export interface ImportSessions {
  completedAt: Timestamp | null;
  createdAt: Generated<Timestamp | null>;
  id: Generated<string>;
  processedRecords: Generated<number | null>;
  sourceArtifactId: string | null;
  sourceType: Generated<string>;
  status: Generated<string>;
  totalRecords: Generated<number | null>;
  workspaceId: string;
}

export interface StagingRecords {
  createdAt: Generated<Timestamp | null>;
  duplicateOfId: string | null;
  fieldMappings: Generated<Json | null>;
  id: Generated<string>;
  importSessionId: string;
  mappedData: Json | null;
  mergeSuggestion: Json | null;
  recordType: string;
  sourceData: Json;
  status: Generated<ImportStatus | null>;
  updatedAt: Generated<Timestamp | null>;
  userDecision: string | null;
}

export interface SourceArtifacts {
  fileHash: string | null;
  filename: string;
  fileSizeBytes: number | null;
  id: Generated<string>;
  label: string | null;
  metadata: Generated<Json | null>;
  mimeType: string | null;
  uploadedAt: Generated<Timestamp | null>;
  workspaceId: string;
}

export interface ProvenanceLinks {
  confidence: Generated<string | null>;
  createdAt: Generated<Timestamp | null>;
  id: Generated<string>;
  notes: string | null;
  sourceArtifactId: string | null;
  sourceDate: Timestamp | null;
  sourceType: string;
  targetField: string | null;
  targetId: string;
  targetTable: string;
  workspaceId: string;
}

export interface ChangeLogEntries {
  action: string;
  afterData: Json | null;
  beforeData: Json | null;
  changedAt: Generated<Timestamp | null>;
  changedBy: string | null;
  id: Generated<string>;
  reason: string | null;
  targetId: string;
  targetTable: string;
  workspaceId: string;
}

// ============================================================================
// CMOS TABLES - Career Entities
// ============================================================================

export interface Achievements {
  achievedDate: Timestamp;
  category: AchievementCategory;
  createdAt: Generated<Timestamp>;
  description: string;
  evidenceUrl: string | null;
  id: Generated<string>;
  quantifiableImpact: string | null;
  title: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Compensation {
  baseSalary: Numeric;
  benefitsNote: string | null;
  bonus: Numeric | null;
  createdAt: Generated<Timestamp>;
  currency: Generated<string>;
  effectiveDate: Timestamp;
  equityValue: Numeric | null;
  id: Generated<string>;
  jobId: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Content {
  contentType: Generated<ContentType>;
  createdAt: Generated<Timestamp>;
  description: string | null;
  engagementMetrics: string | null;
  id: Generated<string>;
  platform: string | null;
  publicationDate: Timestamp;
  title: string;
  updatedAt: Generated<Timestamp>;
  url: string | null;
  workspaceId: string | null; // Added for workspace support
}

export interface Events {
  createdAt: Generated<Timestamp>;
  description: string | null;
  eventDate: Timestamp | null;
  eventEndDate: Timestamp | null;
  eventType: Generated<EventType>;
  id: string;
  location: string | null;
  notes: string | null;
  title: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Feedback {
  context: string | null;
  createdAt: Generated<Timestamp>;
  feedbackDate: Timestamp;
  feedbackType: FeedbackType;
  id: Generated<string>;
  notes: string;
  personId: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Goals {
  createdAt: Generated<Timestamp>;
  description: string;
  goalType: GoalType;
  id: Generated<string>;
  notes: string | null;
  status: Generated<GoalStatus>;
  targetDate: Timestamp;
  title: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Institutions {
  createdAt: Generated<Timestamp>;
  degree: string | null;
  endDate: Timestamp | null;
  fieldOfStudy: string | null;
  id: string;
  location: string | null;
  name: string;
  notes: string | null;
  startDate: Timestamp | null;
  type: Generated<InstitutionType>;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Interactions {
  createdAt: Generated<Timestamp>;
  id: string;
  interactionDate: Timestamp;
  interactionType: InteractionType;
  notes: string | null;
  personId: string;
  projectId: string | null;
  tags: string | null;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface Jobs {
  company: string;
  createdAt: Generated<Timestamp>;
  description: string | null;
  endDate: Timestamp | null;
  id: string;
  isCurrent: Generated<boolean>;
  location: string | null;
  notes: string | null;
  startDate: Timestamp | null;
  title: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
  // Enhanced fields from Helm WorkExperiences
  highlights: Json | null;
  summary: string | null;
  department: string | null;
  employmentType: string | null;
  url: string | null;
}

export interface Learning {
  completionDate: Timestamp | null;
  cost: Numeric | null;
  createdAt: Generated<Timestamp>;
  id: Generated<string>;
  learningType: Generated<LearningType>;
  notes: string | null;
  provider: string | null;
  skillsGained: string | null;
  startDate: Timestamp | null;
  status: Generated<LearningStatus>;
  title: string;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

export interface People {
  company: string | null;
  createdAt: Generated<Timestamp>;
  email: string | null;
  id: string;
  lastContactedAt: Timestamp | null;
  name: string;
  notes: string | null;
  relationshipType: Generated<string | null>;
  role: string | null;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

// MERGED: Projects - CMOS base with Helm enhancements
export interface Projects {
  createdAt: Generated<Timestamp>;
  description: string | null;
  endDate: Timestamp | null;
  id: string;
  name: string;
  startDate: Timestamp | null;
  status: Generated<ProjectStatus>;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
  // Enhanced fields from Helm
  highlights: Json | null;
  keywords: Json | null;
  url: string | null;
  sortOrder: Generated<number | null>;
  profileId: string | null; // Link to profile for resume projects
}

export interface Relationships {
  createdAt: Generated<Timestamp>;
  id: string;
  notes: string | null;
  relationshipLabel: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
}

// MERGED: Skills - CMOS base with Helm enhancements
export interface Skills {
  category: string | null;
  createdAt: Generated<Timestamp>;
  id: string;
  name: string;
  notes: string | null;
  proficiency: Generated<SkillProficiency>;
  updatedAt: Generated<Timestamp>;
  workspaceId: string | null; // Added for workspace support
  // Enhanced fields from Helm
  keywords: Json | null;
  level: string | null;
  sortOrder: Generated<number | null>;
  profileId: string | null; // Link to profile for resume skills
}

// ============================================================================
// UNIFIED DATABASE INTERFACE
// ============================================================================

export interface DB {
  // Auth & Workspace (from Helm)
  users: Users;
  userPasswords: UserPasswords;
  sessions: Sessions;
  oauthAccounts: OauthAccounts;
  oauthStates: OauthStates;
  loginAttempts: LoginAttempts;
  workspaces: Workspaces;
  workspaceMembers: WorkspaceMembers;

  // Profile & Resume (from Helm)
  profiles: Profiles;
  workExperiences: WorkExperiences;
  educationEntries: EducationEntries;
  resumeVariants: ResumeVariants;
  versionSnapshots: VersionSnapshots;
  viewDefinitions: ViewDefinitions;
  publicShareLinks: PublicShareLinks;
  qualityAnalyses: QualityAnalyses;

  // Import & Provenance (from Helm)
  importSessions: ImportSessions;
  stagingRecords: StagingRecords;
  sourceArtifacts: SourceArtifacts;
  provenanceLinks: ProvenanceLinks;
  changeLogEntries: ChangeLogEntries;

  // Career Entities (from CMOS)
  achievements: Achievements;
  compensation: Compensation;
  content: Content;
  events: Events;
  feedback: Feedback;
  goals: Goals;
  institutions: Institutions;
  interactions: Interactions;
  jobs: Jobs;
  learning: Learning;
  people: People;
  projects: Projects;
  relationships: Relationships;
  skills: Skills;
}

// ============================================================================
// ENUM ARRAY VALUES (for zod validation and UI selects)
// ============================================================================

// CMOS Enums
export const ProjectStatusArrayValues: [ProjectStatus, ...ProjectStatus[]] = ["cancelled","completed","in_progress","on_hold","planning"];
export const SkillProficiencyArrayValues: [SkillProficiency, ...SkillProficiency[]] = ["advanced","beginner","expert","intermediate"];
export const InstitutionTypeArrayValues: [InstitutionType, ...InstitutionType[]] = ["bootcamp","college","organization","other","school","university"];
export const EventTypeArrayValues: [EventType, ...EventType[]] = ["conference","interview","meeting","networking","other","presentation","workshop"];
export const EntityTypeArrayValues: [EntityType, ...EntityType[]] = ["event","institution","job","person","project","skill"];
export const InteractionTypeArrayValues: [InteractionType, ...InteractionType[]] = ["call","coffee","email","meeting"];
export const FeedbackTypeArrayValues: [FeedbackType, ...FeedbackType[]] = ["360_feedback","career_coach","one_on_one","peer_feedback","performance_review"];
export const AchievementCategoryArrayValues: [AchievementCategory, ...AchievementCategory[]] = ["award","certification","milestone","promotion","recognition"];
export const GoalTypeArrayValues: [GoalType, ...GoalType[]] = ["career","financial","relationship","skill"];
export const GoalStatusArrayValues: [GoalStatus, ...GoalStatus[]] = ["abandoned","completed","in_progress","not_started"];
export const LearningTypeArrayValues: [LearningType, ...LearningType[]] = ["certification","conference","course","degree","workshop"];
export const LearningStatusArrayValues: [LearningStatus, ...LearningStatus[]] = ["abandoned","completed","in_progress","planned"];
export const ContentTypeArrayValues: [ContentType, ...ContentType[]] = ["article","media_mention","post","publication","speaking"];

// Helm Enums
export const ImportStatusArrayValues: [ImportStatus, ...ImportStatus[]] = ["committed","mapped","merged","pending","skipped"];
export const UserRoleArrayValues: [UserRole, ...UserRole[]] = ["admin","owner","user"];

// Note: kysely maps the table/column/enum names from snake_case to camelCase and PascalCase. 
// When running SQL statements, make sure to use snake_case, but TypeScript code should use camelCase or PascalCase.