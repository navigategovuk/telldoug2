import type { MembershipRole } from "./schema";

export const ROLE_PERMISSIONS: Record<MembershipRole, string[]> = {
  applicant: [
    "applicant:read_self",
    "application:create_self",
    "application:update_self",
    "application:submit_self",
    "document:create_self",
    "document:read_self",
    "message:send_self",
    "message:read_self",
    "assistant:use",
  ],
  caseworker: [
    "applicant:read_org",
    "application:read_org",
    "application:update_org",
    "case:read_org",
    "case:update_org",
    "moderation:review_org",
    "policy:read_org",
    "policy:publish_org",
    "document:review_org",
    "reporting:read_org",
    "assistant:use",
  ],
  platform_admin: [
    "applicant:read_org",
    "application:read_org",
    "application:update_org",
    "case:read_org",
    "case:update_org",
    "moderation:review_org",
    "policy:read_org",
    "policy:publish_org",
    "document:review_org",
    "reporting:read_org",
    "organization:manage",
    "assistant:use",
  ],
};

export function permissionsForRole(role: MembershipRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
