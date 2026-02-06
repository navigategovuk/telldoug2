import { db } from "./db";

export async function writeAuditEvent(input: {
  organizationId: number;
  actorUserId: number | null;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: unknown;
  correlationId?: string;
}) {
  await db
    .insertInto("auditEvents")
    .values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      eventType: input.eventType,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? null) as any,
      correlationId: input.correlationId ?? null,
    })
    .execute();
}

export async function writeAiRun(input: {
  organizationId: number;
  runType: string;
  provider: string;
  modelName: string;
  promptRedacted?: string;
  responseRedacted?: string;
  tokenUsage?: unknown;
  latencyMs?: number;
  outcome: string;
  correlationId?: string;
}) {
  await db
    .insertInto("aiRuns")
    .values({
      organizationId: input.organizationId,
      runType: input.runType,
      provider: input.provider,
      modelName: input.modelName,
      promptRedacted: input.promptRedacted ?? null,
      responseRedacted: input.responseRedacted ?? null,
      tokenUsage: (input.tokenUsage ?? null) as any,
      latencyMs: input.latencyMs ?? null,
      outcome: input.outcome,
      correlationId: input.correlationId ?? null,
    })
    .execute();
}
