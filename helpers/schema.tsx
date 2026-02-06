/**
 * Domain schema for the AI-moderated housing portal.
 * Note: with CamelCasePlugin enabled in Kysely, SQL tables/columns should remain snake_case,
 * while TypeScript access uses camelCase.
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;
export type Numeric = ColumnType<string, number | string, number | string>;

export type Json = JsonValue;
export type JsonArray = JsonValue[];
export type JsonObject = { [x: string]: JsonValue | undefined };
export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type UserRole = "platform_admin" | "caseworker" | "applicant";
export type OrganizationStatus = "active" | "suspended";
export type MembershipRole = "platform_admin" | "caseworker" | "applicant";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_info"
  | "eligible"
  | "ineligible"
  | "allocated"
  | "closed";

export type ModerationDecision = "approved" | "pending_review" | "blocked";
export type ModerationTargetType =
  | "application_field"
  | "message"
  | "document"
  | "assistant_prompt";

export type CasePriority = "low" | "medium" | "high" | "urgent";
export type MessageVisibility = "hidden" | "visible";
export type DocumentVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "needs_recheck";

export interface Organizations {
  id: Generated<number>;
  name: string;
  ukRegion: string;
  status: Generated<OrganizationStatus>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface OrganizationMemberships {
  id: Generated<number>;
  organizationId: number;
  userId: number;
  role: MembershipRole;
  isDefault: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Users {
  id: Generated<number>;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Generated<UserRole>;
  defaultOrganizationId: number | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface UserPasswords {
  id: Generated<number>;
  userId: number;
  passwordHash: string;
  createdAt: Generated<Timestamp>;
}

export interface Sessions {
  id: string;
  userId: number;
  expiresAt: Timestamp;
  createdAt: Generated<Timestamp>;
  lastAccessed: Generated<Timestamp>;
}

export interface LoginAttempts {
  id: Generated<number>;
  email: string;
  attemptedAt: Generated<Timestamp>;
  success: Generated<boolean>;
}

export interface ApplicantProfiles {
  id: Generated<number>;
  organizationId: number;
  userId: number;
  legalFullName: string | null;
  nationalInsuranceNumber: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  dateOfBirth: Timestamp | null;
  consentAccepted: Generated<boolean>;
  consentAcceptedAt: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Applications {
  id: Generated<number>;
  organizationId: number;
  applicantUserId: number;
  profileId: number | null;
  status: Generated<ApplicationStatus>;
  title: string;
  submittedAt: Timestamp | null;
  eligibilityOutcome: Json | null;
  eligibilityConfidence: Numeric | null;
  missingEvidence: Json | null;
  nextSteps: Json | null;
  lockVersion: Generated<number>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface ApplicationHouseholdMembers {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  fullName: string;
  relationship: string;
  dateOfBirth: Timestamp | null;
  employmentStatus: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface ApplicationIncomeRecords {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  incomeType: string;
  amount: Numeric;
  frequency: string;
  evidenceDocumentId: number | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface ApplicationNeeds {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  accessibilityNeeds: string | null;
  medicalNeeds: string | null;
  supportNeeds: string | null;
  structuredNeeds: Json | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Properties {
  id: Generated<number>;
  organizationId: number;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
  localAuthorityCode: string | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Units {
  id: Generated<number>;
  organizationId: number;
  propertyId: number;
  unitRef: string;
  bedrooms: number;
  monthlyRent: Numeric;
  isAccessible: Generated<boolean>;
  status: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Allocations {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  unitId: number;
  offerStatus: string;
  offeredAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  declinedAt: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Documents {
  id: Generated<number>;
  organizationId: number;
  applicationId: number | null;
  uploadedByUserId: number;
  fileName: string;
  mimeType: string;
  storageKey: string;
  fileSize: number;
  antivirusStatus: string | null;
  extractionText: string | null;
  verificationStatus: Generated<DocumentVerificationStatus>;
  moderationDecision: Generated<ModerationDecision>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface CaseFiles {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  assignedCaseworkerUserId: number | null;
  priority: Generated<CasePriority>;
  status: string;
  slaDueAt: Timestamp | null;
  lastReviewedAt: Timestamp | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface CaseNotes {
  id: Generated<number>;
  organizationId: number;
  caseFileId: number;
  authorUserId: number;
  body: string;
  createdAt: Generated<Timestamp>;
}

export interface Messages {
  id: Generated<number>;
  organizationId: number;
  applicationId: number;
  senderUserId: number;
  recipientUserId: number | null;
  body: string;
  moderationDecision: Generated<ModerationDecision>;
  visibility: Generated<MessageVisibility>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface ModerationItems {
  id: Generated<number>;
  organizationId: number;
  targetType: ModerationTargetType;
  targetId: string;
  rawText: string | null;
  piiFindings: Json | null;
  modelFlags: Json | null;
  ruleFlags: Json | null;
  riskScore: number;
  decision: ModerationDecision;
  policyVersionId: number | null;
  createdByUserId: number | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface ModerationEvents {
  id: Generated<number>;
  organizationId: number;
  moderationItemId: number;
  actorUserId: number | null;
  eventType: string;
  reason: string | null;
  metadata: Json | null;
  createdAt: Generated<Timestamp>;
}

export interface PolicyVersions {
  id: Generated<number>;
  organizationId: number;
  versionNumber: number;
  title: string;
  rules: Json;
  isActive: Generated<boolean>;
  publishedByUserId: number;
  createdAt: Generated<Timestamp>;
}

export interface AiRuns {
  id: Generated<number>;
  organizationId: number;
  runType: string;
  provider: string;
  modelName: string;
  promptRedacted: string | null;
  responseRedacted: string | null;
  tokenUsage: Json | null;
  latencyMs: number | null;
  outcome: string;
  correlationId: string | null;
  createdAt: Generated<Timestamp>;
}

export interface AuditEvents {
  id: Generated<number>;
  organizationId: number;
  actorUserId: number | null;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Json | null;
  correlationId: string | null;
  createdAt: Generated<Timestamp>;
}

export interface PiiAccessLogs {
  id: Generated<number>;
  organizationId: number;
  actorUserId: number;
  entityType: string;
  entityId: string;
  fieldsAccessed: Json;
  reason: string | null;
  correlationId: string | null;
  createdAt: Generated<Timestamp>;
}

export interface KnowledgeDocuments {
  id: Generated<number>;
  organizationId: number;
  title: string;
  content: string;
  sourceUrl: string | null;
  tags: Json | null;
  isApproved: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface DB {
  organizations: Organizations;
  organizationMemberships: OrganizationMemberships;
  users: Users;
  userPasswords: UserPasswords;
  sessions: Sessions;
  loginAttempts: LoginAttempts;
  applicantProfiles: ApplicantProfiles;
  applications: Applications;
  applicationHouseholdMembers: ApplicationHouseholdMembers;
  applicationIncomeRecords: ApplicationIncomeRecords;
  applicationNeeds: ApplicationNeeds;
  properties: Properties;
  units: Units;
  allocations: Allocations;
  documents: Documents;
  caseFiles: CaseFiles;
  caseNotes: CaseNotes;
  messages: Messages;
  moderationItems: ModerationItems;
  moderationEvents: ModerationEvents;
  policyVersions: PolicyVersions;
  aiRuns: AiRuns;
  auditEvents: AuditEvents;
  piiAccessLogs: PiiAccessLogs;
  knowledgeDocuments: KnowledgeDocuments;
}

export const UserRoleArrayValues: [UserRole, ...UserRole[]] = [
  "platform_admin",
  "caseworker",
  "applicant",
];

export const MembershipRoleArrayValues: [MembershipRole, ...MembershipRole[]] = [
  "platform_admin",
  "caseworker",
  "applicant",
];

export const OrganizationStatusArrayValues: [
  OrganizationStatus,
  ...OrganizationStatus[],
] = ["active", "suspended"];

export const ApplicationStatusArrayValues: [
  ApplicationStatus,
  ...ApplicationStatus[],
] = [
  "draft",
  "submitted",
  "in_review",
  "needs_info",
  "eligible",
  "ineligible",
  "allocated",
  "closed",
];

export const ModerationDecisionArrayValues: [
  ModerationDecision,
  ...ModerationDecision[],
] = ["approved", "pending_review", "blocked"];

export const ModerationTargetTypeArrayValues: [
  ModerationTargetType,
  ...ModerationTargetType[],
] = ["application_field", "message", "document", "assistant_prompt"];

export const CasePriorityArrayValues: [CasePriority, ...CasePriority[]] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const MessageVisibilityArrayValues: [
  MessageVisibility,
  ...MessageVisibility[],
] = ["hidden", "visible"];

export const DocumentVerificationStatusArrayValues: [
  DocumentVerificationStatus,
  ...DocumentVerificationStatus[],
] = ["pending", "verified", "rejected", "needs_recheck"];
