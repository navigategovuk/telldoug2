import { handleEndpointError } from "../../helpers/endpointError";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    return jsonResponse({
      memberships: ctx.memberships,
      activeOrganizationId: ctx.activeOrganizationId,
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
