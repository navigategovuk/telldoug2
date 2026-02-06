import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./send_POST.schema";
import { moderateArtifact } from "../../helpers/moderationEngine";
import { getCorrelationId } from "../../helpers/requestContext";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    const app = await db
      .selectFrom("applications")
      .select(["id", "applicantUserId"])
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", input.applicationId)
      .executeTakeFirst();

    if (!app) {
      return jsonResponse({ error: "Application not found" }, 404, { correlationId });
    }

    if (ctx.activeMembershipRole === "applicant" && app.applicantUserId !== ctx.user.id) {
      return jsonResponse({ error: "Cannot send message to another case" }, 403, { correlationId });
    }

    let moderationDecision: "approved" | "pending_review" | "blocked" = "pending_review";
    try {
      const moderation = await moderateArtifact({
        organizationId: ctx.activeOrganizationId,
        createdByUserId: ctx.user.id,
        targetType: "message",
        targetId: `app:${input.applicationId}:sender:${ctx.user.id}`,
        text: input.body,
        correlationId,
      });
      moderationDecision = moderation.decision;
    } catch {
      moderationDecision = "pending_review";
    }

    const visibility = moderationDecision === "approved" ? "visible" : "hidden";

    const inserted = await db
      .insertInto("messages")
      .values({
        organizationId: ctx.activeOrganizationId,
        applicationId: input.applicationId,
        senderUserId: ctx.user.id,
        recipientUserId: input.recipientUserId ?? null,
        body: input.body,
        moderationDecision,
        visibility,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return jsonResponse({
      messageId: inserted.id,
      moderationDecision,
      visibility,
    }, 200, { correlationId });
  } catch (error) {
    return handleEndpointError(error);
  }
}
