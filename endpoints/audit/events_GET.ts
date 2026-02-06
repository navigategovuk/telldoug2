import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(10, Number(url.searchParams.get("limit") ?? 100)));

    const events = await db
      .selectFrom("auditEvents")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .execute();

    return jsonResponse({
      events: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        actorUserId: event.actorUserId,
        metadata: event.metadata,
        createdAt: new Date(event.createdAt as any).toISOString(),
      })),
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
