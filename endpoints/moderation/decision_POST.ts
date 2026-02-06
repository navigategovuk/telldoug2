import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./decision_POST.schema";
import { writeAuditEvent } from "../../helpers/audit";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const input = schema.parse(await parseRequestBody(request));

    const moderationItem = await db
      .selectFrom("moderationItems")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", input.moderationItemId)
      .executeTakeFirst();

    if (!moderationItem) {
      return jsonResponse({ error: "Moderation item not found" }, 404);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("moderationItems")
        .set({ decision: input.decision, updatedAt: new Date() })
        .where("id", "=", moderationItem.id)
        .execute();

      await trx
        .insertInto("moderationEvents")
        .values({
          organizationId: ctx.activeOrganizationId,
          moderationItemId: moderationItem.id,
          actorUserId: ctx.user.id,
          eventType: "manual_decision",
          reason: input.reason,
          metadata: {
            previousDecision: moderationItem.decision,
            newDecision: input.decision,
          } as any,
        })
        .execute();

      if (moderationItem.targetType === "message") {
        await trx
          .updateTable("messages")
          .set({
            moderationDecision: input.decision,
            visibility: input.decision === "approved" ? "visible" : "hidden",
            updatedAt: new Date(),
          })
          .where("id", "=", Number(moderationItem.targetId))
          .execute();
      }

      if (moderationItem.targetType === "document") {
        await trx
          .updateTable("documents")
          .set({ moderationDecision: input.decision, updatedAt: new Date() })
          .where("id", "=", Number(moderationItem.targetId))
          .execute();
      }

      if (moderationItem.targetType === "application_field") {
        const appId = Number(moderationItem.targetId);
        const appStatus = input.decision === "blocked" ? "needs_info" : "in_review";
        await trx
          .updateTable("applications")
          .set({ status: appStatus, updatedAt: new Date() })
          .where("id", "=", appId)
          .where("organizationId", "=", ctx.activeOrganizationId)
          .execute();
      }
    });

    await writeAuditEvent({
      organizationId: ctx.activeOrganizationId,
      actorUserId: ctx.user.id,
      eventType: "moderation.override",
      entityType: "moderation_item",
      entityId: String(moderationItem.id),
      metadata: { decision: input.decision, reason: input.reason },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
