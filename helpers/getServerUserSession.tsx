import { db } from "./db";
import { User, OrganizationMembership } from "./User";
import {
  CleanupProbability,
  SessionExpirationSeconds,
  getServerSessionOrThrow,
  NotAuthenticatedError,
} from "./getSetServerSession";
import { MembershipRole } from "./schema";
import { permissionsForRole } from "./permissions";

export class ForbiddenError extends Error {
  constructor(message?: string) {
    super(message ?? "Forbidden");
    this.name = "ForbiddenError";
  }
}

export interface ServerSessionContext {
  user: User;
  session: {
    id: string;
    createdAt: Date;
    lastAccessed: Date;
    activeOrganizationId: number | null;
    mfaPending: boolean;
  };
  memberships: OrganizationMembership[];
  activeOrganizationId: number;
  activeMembershipRole: MembershipRole;
  permissions: string[];
}

function normalizeMembershipRole(role: string): MembershipRole {
  if (role === "platform_admin" || role === "caseworker" || role === "applicant") {
    return role;
  }
  return "applicant";
}

export async function getServerUserSession(
  request: Request,
  opts?: { allowMfaPending?: boolean }
): Promise<ServerSessionContext> {
  const session = await getServerSessionOrThrow(request);

  if (!opts?.allowMfaPending && session.mfaPending) {
    throw new NotAuthenticatedError("MFA required");
  }

  // Optional periodic cleanup for expired sessions.
  if (Math.random() < CleanupProbability) {
    const expirationDate = new Date(Date.now() - SessionExpirationSeconds * 1000);
    try {
      await db
        .deleteFrom("sessions")
        .where("lastAccessed", "<", expirationDate)
        .execute();
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }

  const joined = await db
    .selectFrom("sessions")
    .innerJoin("users", "sessions.userId", "users.id")
    .select([
      "sessions.id as sessionId",
      "sessions.createdAt as sessionCreatedAt",
      "sessions.lastAccessed as sessionLastAccessed",
      "sessions.expiresAt as sessionExpiresAt",
      "users.id as userId",
      "users.email as email",
      "users.displayName as displayName",
      "users.avatarUrl as avatarUrl",
      "users.role as role",
      "users.defaultOrganizationId as defaultOrganizationId",
    ])
    .where("sessions.id", "=", session.id)
    .executeTakeFirst();

  if (!joined) {
    throw new NotAuthenticatedError();
  }

  const now = new Date();
  const expiresAt = new Date(joined.sessionExpiresAt as unknown as string);
  if (now > expiresAt) {
    throw new NotAuthenticatedError("Session expired");
  }

  const membershipRows = await db
    .selectFrom("organizationMemberships")
    .innerJoin("organizations", "organizationMemberships.organizationId", "organizations.id")
    .select([
      "organizationMemberships.organizationId as organizationId",
      "organizationMemberships.role as role",
      "organizationMemberships.isDefault as isDefault",
      "organizations.name as organizationName",
      "organizations.status as organizationStatus",
    ])
    .where("organizationMemberships.userId", "=", joined.userId)
    .where("organizations.status", "=", "active")
    .execute();

  if (membershipRows.length === 0) {
    throw new ForbiddenError("No active organization memberships");
  }

  const memberships: OrganizationMembership[] = membershipRows.map((row) => ({
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    role: normalizeMembershipRole(row.role),
    isDefault: Boolean(row.isDefault),
  }));

  const matched = memberships.find((m) => m.organizationId === session.activeOrganizationId);
  const defaultMembership = memberships.find((m) => m.isDefault) ?? memberships[0];
  const activeMembership = matched ?? defaultMembership;

  const user: User = {
    id: joined.userId,
    email: joined.email,
    displayName: joined.displayName,
    avatarUrl: joined.avatarUrl,
    role: normalizeMembershipRole(joined.role),
    defaultOrganizationId: joined.defaultOrganizationId,
  };

  const permissions = permissionsForRole(activeMembership.role);

  await db
    .updateTable("sessions")
    .set({ lastAccessed: now })
    .where("id", "=", session.id)
    .execute();

  return {
    user,
    session: {
      id: session.id,
      createdAt: new Date(session.createdAt),
      lastAccessed: now,
      activeOrganizationId: activeMembership.organizationId,
      mfaPending: session.mfaPending,
    },
    memberships,
    activeOrganizationId: activeMembership.organizationId,
    activeMembershipRole: activeMembership.role,
    permissions,
  };
}

export async function requireRole(
  request: Request,
  allowedRoles: MembershipRole[]
): Promise<ServerSessionContext> {
  const context = await getServerUserSession(request);
  if (!allowedRoles.includes(context.activeMembershipRole)) {
    throw new ForbiddenError("Insufficient role for this operation");
  }
  return context;
}
