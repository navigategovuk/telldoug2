import { handleEndpointError } from "../../helpers/endpointError";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { jsonResponse } from "../../helpers/http";
import { setServerSession } from "../../helpers/getSetServerSession";
import { toSessionContext } from "../../helpers/sessionContext";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const response = jsonResponse(toSessionContext(ctx));

    await setServerSession(response, {
      id: ctx.session.id,
      createdAt: ctx.session.createdAt.getTime(),
      lastAccessed: Date.now(),
      activeOrganizationId: ctx.activeOrganizationId,
      mfaPending: false,
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
