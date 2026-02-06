import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./attach_POST.schema";
import { moderateArtifact } from "../../helpers/moderationEngine";
import { getCorrelationId } from "../../helpers/requestContext";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    if (ctx.activeMembershipRole === "applicant" && !ctx.permissions.includes("document:create_self")) {
      return jsonResponse({ error: "Missing document upload permissions" }, 403, { correlationId });
    }

    if (input.applicationId) {
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
        return jsonResponse({ error: "Cannot attach to another applicant's case" }, 403, { correlationId });
      }
    }

    const inserted = await db
      .insertInto("documents")
      .values({
        organizationId: ctx.activeOrganizationId,
        applicationId: input.applicationId ?? null,
        uploadedByUserId: ctx.user.id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        storageKey: input.storageKey,
        fileSize: input.fileSize,
        antivirusStatus: "pending_scan",
        extractionText: input.extractedText ?? null,
        verificationStatus: "pending",
        moderationDecision: "pending_review",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    let moderationDecision: "approved" | "pending_review" | "blocked" = "pending_review";
    try {
      const moderation = await moderateArtifact({
        organizationId: ctx.activeOrganizationId,
        createdByUserId: ctx.user.id,
        targetType: "document",
        targetId: String(inserted.id),
        text: input.extractedText ?? input.fileName,
        correlationId,
      });
      moderationDecision = moderation.decision;
    } catch {
      moderationDecision = "pending_review";
    }

    await db
      .updateTable("documents")
      .set({
        moderationDecision,
        antivirusStatus: "queued",
        updatedAt: new Date(),
      })
      .where("id", "=", inserted.id)
      .execute();

    return jsonResponse({
      documentId: inserted.id,
      moderationDecision,
    }, 200, { correlationId });
  } catch (error) {
    return handleEndpointError(error);
  }
}
