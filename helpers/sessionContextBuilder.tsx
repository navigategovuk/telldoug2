import { db } from "./db";
import { SessionContext, User } from "./User";
import { MembershipRole } from "./schema";
import { permissionsForRole } from "./permissions";

function normalizeRole(role: string): MembershipRole {
  if (role === "platform_admin" || role === "caseworker" || role === "applicant") {
    return role;
  }
  return "applicant";
}

export async function buildSessionContextForUser(input: {
  userId: number;
  preferredOrganizationId?: number | null;
}): Promise<SessionContext & { activeMembershipRole: MembershipRole }> {
  const userRow = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", input.userId)
    .executeTakeFirstOrThrow();

  const membershipRows = await db
    .selectFrom("organizationMemberships")
    .innerJoin("organizations", "organizationMemberships.organizationId", "organizations.id")
    .select([
      "organizationMemberships.organizationId as organizationId",
      "organizationMemberships.role as role",
      "organizationMemberships.isDefault as isDefault",
      "organizations.name as organizationName",
    ])
    .where("organizationMemberships.userId", "=", input.userId)
    .where("organizations.status", "=", "active")
    .execute();

  if (membershipRows.length === 0) {
    throw new Error("No active organization memberships found");
  }

  const memberships = membershipRows.map((row) => ({
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    role: normalizeRole(row.role),
    isDefault: Boolean(row.isDefault),
  }));

  const activeMembership =
    memberships.find((m) => m.organizationId === input.preferredOrganizationId) ??
    memberships.find((m) => m.isDefault) ??
    memberships[0];

  const user: User = {
    id: userRow.id,
    email: userRow.email,
    displayName: userRow.displayName,
    avatarUrl: userRow.avatarUrl,
    role: normalizeRole(userRow.role),
    defaultOrganizationId: userRow.defaultOrganizationId,
  };

  return {
    user,
    memberships,
    activeOrganizationId: activeMembership.organizationId,
    permissions: permissionsForRole(activeMembership.role),
    activeMembershipRole: activeMembership.role,
  };
}
