import { db } from "./db";

export interface PolicyRuleSet {
  blockedPhrases?: string[];
  watchPhrases?: string[];
  blockedRegex?: string[];
}

export async function getActivePolicyVersion(organizationId: number) {
  return db
    .selectFrom("policyVersions")
    .selectAll()
    .where("organizationId", "=", organizationId)
    .where("isActive", "=", true)
    .orderBy("versionNumber", "desc")
    .executeTakeFirst();
}

export function evaluatePolicyRules(input: {
  text: string;
  rules: PolicyRuleSet | null | undefined;
}) {
  const rules = input.rules ?? {};
  const lcText = input.text.toLowerCase();

  const hardBlocks: string[] = [];
  const warnings: string[] = [];

  for (const phrase of rules.blockedPhrases ?? []) {
    if (lcText.includes(phrase.toLowerCase())) {
      hardBlocks.push(`blocked_phrase:${phrase}`);
    }
  }

  for (const phrase of rules.watchPhrases ?? []) {
    if (lcText.includes(phrase.toLowerCase())) {
      warnings.push(`watch_phrase:${phrase}`);
    }
  }

  for (const expr of rules.blockedRegex ?? []) {
    try {
      const regex = new RegExp(expr, "i");
      if (regex.test(input.text)) {
        hardBlocks.push(`blocked_regex:${expr}`);
      }
    } catch {
      warnings.push(`invalid_rule_regex:${expr}`);
    }
  }

  return {
    hardBlocks,
    warnings,
  };
}
