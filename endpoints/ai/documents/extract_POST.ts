import { db } from "../../../helpers/db";
import { getAiProvider } from "../../../helpers/ai";
import { handleEndpointError } from "../../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { schema } from "./extract_POST.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { writeAiRun, writeAuditEvent } from "../../../helpers/audit";
import { getCorrelationId } from "../../../helpers/requestContext";
import { moderateArtifact } from "../../../helpers/moderationEngine";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    let documentText = input.documentText ?? "";
    let targetDocumentId: number | null = null;

    if (input.documentId) {
      const document = await db
        .selectFrom("documents")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("id", "=", input.documentId)
        .executeTakeFirst();

      if (!document) {
        return jsonResponse({ error: "Document not found" }, 404, { correlationId });
      }

      if (ctx.activeMembershipRole === "applicant" && document.uploadedByUserId !== ctx.user.id) {
        return jsonResponse({ error: "Access denied" }, 403, { correlationId });
      }

      targetDocumentId = document.id;
      documentText = document.extractionText ?? input.documentText ?? "";
    }

    if (!documentText) {
      return jsonResponse(
        { error: "documentText is required if no document has extraction text" },
        400,
        { correlationId }
      );
    }

    const provider = getAiProvider();
    const startedAt = Date.now();
    let extraction;
    let latencyMs = 0;
    let providerFallback = false;
    try {
      extraction = await provider.extractDocument({
        documentText,
        documentType: input.documentType,
      });
      latencyMs = Date.now() - startedAt;
    } catch (error) {
      latencyMs = Date.now() - startedAt;
      providerFallback = true;
      extraction = {
        summary: "Extraction pending manual review due to AI provider unavailability.",
        extractedFields: {},
        confidence: 0,
      };
      await writeAuditEvent({
        organizationId: ctx.activeOrganizationId,
        actorUserId: ctx.user.id,
        eventType: "ai.fallback",
        entityType: "document",
        entityId: String(targetDocumentId ?? `adhoc:${ctx.user.id}`),
        metadata: {
          source: "document_extract",
          reason: error instanceof Error ? error.message : "provider_failure",
        },
        correlationId,
      });
    }

    let moderationDecision: "approved" | "pending_review" | "blocked" = "pending_review";
    try {
      const moderation = await moderateArtifact({
        organizationId: ctx.activeOrganizationId,
        createdByUserId: ctx.user.id,
        targetType: "document",
        targetId: String(targetDocumentId ?? `adhoc:${ctx.user.id}`),
        text: extraction.summary,
        correlationId,
      });
      moderationDecision = moderation.decision;
    } catch {
      moderationDecision = "pending_review";
    }

    if (targetDocumentId) {
      await db
        .updateTable("documents")
        .set({
          extractionText: extraction.summary,
          moderationDecision,
          updatedAt: new Date(),
        })
        .where("id", "=", targetDocumentId)
        .execute();
    }

    await writeAiRun({
      organizationId: ctx.activeOrganizationId,
      runType: "document_extract",
      provider: provider.name,
      modelName: provider.model,
      promptRedacted: "document_extract",
      responseRedacted: extraction.summary,
      latencyMs,
      outcome: providerFallback ? "provider_error_fallback" : "success",
      correlationId,
    });

    return jsonResponse({ ...extraction, moderationDecision, providerFallback }, 200, {
      correlationId,
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
