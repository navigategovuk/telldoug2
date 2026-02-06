import { SessionContext } from "./User";
import { ServerSessionContext } from "./getServerUserSession";

export function toSessionContext(context: ServerSessionContext): SessionContext {
  return {
    user: context.user,
    memberships: context.memberships,
    activeOrganizationId: context.activeOrganizationId,
    permissions: context.permissions,
  };
}
