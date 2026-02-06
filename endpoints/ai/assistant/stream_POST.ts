import { db } from "../../../helpers/db";
import { getAiProvider } from "../../../helpers/ai";
import { handleEndpointError } from "../../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { schema } from "./stream_POST.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { writeAiRun } from "../../../helpers/audit";
import { getCorrelationId } from "../../../helpers/requestContext";
import { moderateArtifact } from "../../../helpers/moderationEngine";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    if (!ctx.permissions.includes("assistant:use")) {
      return jsonResponse({ error: "Missing assistant permissions" }, 403, { correlationId });
    }

    const moderation = await moderateArtifact({
      organizationId: ctx.activeOrganizationId,
      createdByUserId: ctx.user.id,
      targetType: "assistant_prompt",
      targetId: `assistant:${ctx.user.id}:${Date.now()}`,
      text: input.prompt,
      correlationId,
    });

    if (moderation.decision === "blocked") {
      return jsonResponse({ error: "Prompt blocked by moderation policy" }, 400, { correlationId });
    }

    const knowledge = await db
      .selectFrom("knowledgeDocuments")
      .select(["title", "content", "sourceUrl"])
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("isApproved", "=", true)
      .orderBy("updatedAt", "desc")
      .limit(8)
      .execute();

    const provider = getAiProvider();
    const startedAt = Date.now();
    const stream = await provider.assistantReply({
      prompt: input.prompt,
      contextDocuments: knowledge,
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "x-correlation-id": correlationId,
      },
    });

    await writeAiRun({
      organizationId: ctx.activeOrganizationId,
      runType: "assistant_stream",
      provider: provider.name,
      modelName: provider.model,
      promptRedacted: "assistant_prompt",
      responseRedacted: null as any,
      latencyMs: Date.now() - startedAt,
      outcome: moderation.decision === "pending_review" ? "success_pending_review" : "success",
      correlationId,
    });

    return response;
  } catch (error) {
    return handleEndpointError(error);
  }
}
