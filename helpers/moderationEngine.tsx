import { db } from "./db";
import { getAiProvider } from "./ai";
import { getActivePolicyVersion, evaluatePolicyRules, PolicyRuleSet } from "./policyEngine";
import { scanPii } from "./pii";
import { ModerationDecision, ModerationTargetType } from "./schema";
import { writeAuditEvent } from "./audit";

const SEVERE_CATEGORIES = [
  "violence",
  "self-harm",
  "self_harm",
  "hate",
  "harassment",
  "sexual/minors",
  "sexual_minors",
];

export interface ModerateArtifactInput {
  organizationId: number;
  createdByUserId: number | null;
  targetType: ModerationTargetType;
  targetId: string;
  text: string;
  correlationId?: string;
}

function decideModeration(input: {
  hardBlocks: string[];
  aiFlagged: boolean;
  severityTriggered: boolean;
  riskScore: number;
}): ModerationDecision {
  if (input.hardBlocks.length > 0 || input.severityTriggered) {
    return "blocked";
  }

  if (input.aiFlagged || input.riskScore >= 0.5) {
    return "pending_review";
  }

  return "approved";
}

export async function moderateArtifact(input: ModerateArtifactInput) {
  const aiProvider = getAiProvider();
  const piiFindings = scanPii(input.text);

  const policy = await getActivePolicyVersion(input.organizationId);
  const policyRules = (policy?.rules ?? {}) as PolicyRuleSet;
  const policyResult = evaluatePolicyRules({ text: input.text, rules: policyRules });

  const aiModeration = await aiProvider.moderateText({ text: input.text });
  const maxModelScore = Math.max(
    0,
    ...Object.values(aiModeration.categoryScores ?? {}).map((value) => Number(value) || 0)
  );

  const severityTriggered = Object.entries(aiModeration.categories ?? {}).some(
    ([name, flagged]) => Boolean(flagged) && SEVERE_CATEGORIES.includes(name)
  );

  const riskScore = Math.min(
    1,
    maxModelScore * 0.6 +
      (aiModeration.flagged ? 0.2 : 0) +
      Math.min(0.15, piiFindings.length * 0.03) +
      Math.min(0.2, policyResult.warnings.length * 0.05)
  );

  const decision = decideModeration({
    hardBlocks: policyResult.hardBlocks,
    aiFlagged: aiModeration.flagged,
    severityTriggered,
    riskScore,
  });

  const moderationItem = await db
    .insertInto("moderationItems")
    .values({
      organizationId: input.organizationId,
      createdByUserId: input.createdByUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      rawText: input.text,
      piiFindings: piiFindings as any,
      modelFlags: {
        categories: aiModeration.categories,
        categoryScores: aiModeration.categoryScores,
        flagged: aiModeration.flagged,
      } as any,
      ruleFlags: {
        hardBlocks: policyResult.hardBlocks,
        warnings: policyResult.warnings,
      } as any,
      riskScore,
      decision,
      policyVersionId: policy?.id ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .insertInto("moderationEvents")
    .values({
      organizationId: input.organizationId,
      moderationItemId: moderationItem.id,
      actorUserId: input.createdByUserId,
      eventType: "decision_created",
      reason:
        decision === "approved"
          ? "auto_approved"
          : decision === "blocked"
            ? "blocked_by_policy_or_severity"
            : "queued_for_review",
      metadata: {
        riskScore,
      } as any,
    })
    .execute();

  await writeAuditEvent({
    organizationId: input.organizationId,
    actorUserId: input.createdByUserId,
    eventType: "moderation.evaluated",
    entityType: input.targetType,
    entityId: input.targetId,
    metadata: { decision, riskScore },
    correlationId: input.correlationId,
  });

  return {
    decision,
    riskScore,
    moderationItem,
  };
}
