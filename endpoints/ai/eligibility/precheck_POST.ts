import { db } from "../../../helpers/db";
import { getAiProvider } from "../../../helpers/ai";
import { handleEndpointError } from "../../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { schema } from "./precheck_POST.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { writeAiRun, writeAuditEvent } from "../../../helpers/audit";
import { getCorrelationId } from "../../../helpers/requestContext";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    let profilePayload = input.profile ?? {};
    let applicationPayload = input.application ?? {};

    if (input.applicationId) {
      const app = await db
        .selectFrom("applications")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("id", "=", input.applicationId)
        .executeTakeFirst();

      if (!app) {
        return jsonResponse({ error: "Application not found" }, 404, { correlationId });
      }

      if (ctx.activeMembershipRole === "applicant" && app.applicantUserId !== ctx.user.id) {
        return jsonResponse({ error: "Access denied" }, 403, { correlationId });
      }

      const profile = await db
        .selectFrom("applicantProfiles")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("userId", "=", app.applicantUserId)
        .executeTakeFirst();

      profilePayload = profile ?? {};
      applicationPayload = app;
    }

    const aiProvider = getAiProvider();
    const startedAt = Date.now();
    let result;
    let latencyMs = 0;
    let providerFallback = false;
    try {
      result = await aiProvider.eligibilityPrecheck({
        profile: profilePayload,
        application: applicationPayload,
      });
      latencyMs = Date.now() - startedAt;
    } catch (error) {
      latencyMs = Date.now() - startedAt;
      providerFallback = true;
      result = {
        provisionalOutcome: "uncertain" as const,
        confidence: 0,
        missingEvidence: ["AI provider unavailable during precheck"],
        nextSteps: ["Caseworker manual review required"],
        rationale: "Provider failure fallback",
      };

      await writeAuditEvent({
        organizationId: ctx.activeOrganizationId,
        actorUserId: ctx.user.id,
        eventType: "ai.fallback",
        entityType: "application",
        ...(input.applicationId ? { entityId: String(input.applicationId) } : {}),
        metadata: {
          source: "eligibility_precheck",
          reason: error instanceof Error ? error.message : "provider_failure",
        },
        correlationId,
      });
    }

    if (input.applicationId) {
      await db
        .updateTable("applications")
        .set({
          eligibilityOutcome: {
            provisionalOutcome: result.provisionalOutcome,
            rationale: result.rationale,
          } as any,
          eligibilityConfidence: String(result.confidence),
          missingEvidence: result.missingEvidence as any,
          nextSteps: result.nextSteps as any,
          updatedAt: new Date(),
        })
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("id", "=", input.applicationId)
        .execute();
    }

    await writeAiRun({
      organizationId: ctx.activeOrganizationId,
      runType: "eligibility_precheck",
      provider: aiProvider.name,
      modelName: aiProvider.model,
      promptRedacted: "eligibility_precheck",
      responseRedacted: JSON.stringify({
        provisionalOutcome: result.provisionalOutcome,
        confidence: result.confidence,
      }),
      latencyMs,
      outcome: providerFallback ? "provider_error_fallback" : "success",
      correlationId,
    });

    return jsonResponse({
      ...result,
      label: "AI-assisted precheck, not final authority decision.",
      providerFallback,
    }, 200, { correlationId });
  } catch (error) {
    return handleEndpointError(error);
  }
}
