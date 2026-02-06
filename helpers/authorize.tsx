import { ForbiddenError, getServerUserSession, ServerSessionContext } from "./getServerUserSession";
import { MembershipRole } from "./schema";

export async function requireAnyRole(
  request: Request,
  allowedRoles: MembershipRole[]
): Promise<ServerSessionContext> {
  const ctx = await getServerUserSession(request);
  if (!allowedRoles.includes(ctx.activeMembershipRole)) {
    throw new ForbiddenError("Role is not allowed for this endpoint");
  }
  return ctx;
}

export async function requirePermission(
  request: Request,
  permission: string
): Promise<ServerSessionContext> {
  const ctx = await getServerUserSession(request);
  if (!ctx.permissions.includes(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  return ctx;
}
