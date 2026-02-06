import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./request-recheck_POST.schema";
import { writeAuditEvent } from "../../helpers/audit";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));

    const document = await db
      .selectFrom("documents")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", input.documentId)
      .executeTakeFirst();

    if (!document) {
      return jsonResponse({ error: "Document not found" }, 404);
    }

    if (
      ctx.activeMembershipRole === "applicant" &&
      document.uploadedByUserId !== ctx.user.id
    ) {
      return jsonResponse({ error: "Access denied" }, 403);
    }

    await db
      .updateTable("documents")
      .set({
        verificationStatus: "needs_recheck",
        updatedAt: new Date(),
      })
      .where("id", "=", document.id)
      .execute();

    await writeAuditEvent({
      organizationId: ctx.activeOrganizationId,
      actorUserId: ctx.user.id,
      eventType: "document.recheck_requested",
      entityType: "document",
      entityId: String(document.id),
      metadata: { reason: input.reason },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
