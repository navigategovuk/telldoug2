export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "platform_admin" | "caseworker" | "applicant";
  defaultOrganizationId: number | null;
}

export interface OrganizationMembership {
  organizationId: number;
  organizationName: string;
  role: "platform_admin" | "caseworker" | "applicant";
  isDefault: boolean;
}

export interface SessionContext {
  user: User;
  memberships: OrganizationMembership[];
  activeOrganizationId: number;
  permissions: string[];
}
