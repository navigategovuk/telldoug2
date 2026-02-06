import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./switch_POST.schema";
import { handleEndpointError } from "../../helpers/endpointError";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { setServerSession } from "../../helpers/getSetServerSession";
import { buildSessionContextForUser } from "../../helpers/sessionContextBuilder";

export async function handle(request: Request) {
  try {
    const input = schema.parse(await parseRequestBody(request));
    const ctx = await getServerUserSession(request);

    const hasMembership = ctx.memberships.some((m) => m.organizationId === input.organizationId);
    if (!hasMembership) {
      return jsonResponse({ error: "Organization access denied" }, 403);
    }

    const updatedContext = await buildSessionContextForUser({
      userId: ctx.user.id,
      preferredOrganizationId: input.organizationId,
    });

    const response = jsonResponse({
      user: updatedContext.user,
      memberships: updatedContext.memberships,
      activeOrganizationId: updatedContext.activeOrganizationId,
      permissions: updatedContext.permissions,
    });

    await setServerSession(response, {
      id: ctx.session.id,
      createdAt: ctx.session.createdAt.getTime(),
      lastAccessed: Date.now(),
      activeOrganizationId: updatedContext.activeOrganizationId,
      mfaPending: false,
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
