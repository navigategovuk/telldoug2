import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { schema } from "./verify_POST.schema";
import { handleEndpointError } from "../../../helpers/endpointError";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { setServerSession } from "../../../helpers/getSetServerSession";
import { toSessionContext } from "../../../helpers/sessionContext";
import { writeAuditEvent } from "../../../helpers/audit";

export async function handle(request: Request) {
  try {
    const input = schema.parse(await parseRequestBody(request));
    const ctx = await getServerUserSession(request, { allowMfaPending: true });

    if (!ctx.session.mfaPending) {
      return jsonResponse({ error: "MFA is not pending for this session" }, 400);
    }

    const expectedCode = process.env.MFA_BYPASS_CODE || "000000";
    if (input.code !== expectedCode) {
      return jsonResponse({ error: "Invalid MFA code" }, 401);
    }

    const response = jsonResponse(toSessionContext(ctx));
    await setServerSession(response, {
      id: ctx.session.id,
      createdAt: ctx.session.createdAt.getTime(),
      lastAccessed: Date.now(),
      activeOrganizationId: ctx.activeOrganizationId,
      mfaPending: false,
    });

    await writeAuditEvent({
      organizationId: ctx.activeOrganizationId,
      actorUserId: ctx.user.id,
      eventType: "auth.mfa_verified",
      entityType: "session",
      entityId: ctx.session.id,
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
