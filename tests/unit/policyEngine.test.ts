import { describe, expect, it, vi } from "vitest";

vi.mock("../../helpers/db", () => ({
  db: {},
}));

import { evaluatePolicyRules } from "../../helpers/policyEngine";

describe("policyEngine", () => {
  it("flags blocked phrases, watch phrases, and blocked regex", () => {
    const result = evaluatePolicyRules({
      text: "This text includes banned-term and caution-word and REF-1234",
      rules: {
        blockedPhrases: ["banned-term"],
        watchPhrases: ["caution-word"],
        blockedRegex: ["REF-\\d{4}"],
      },
    });

    expect(result.hardBlocks).toContain("blocked_phrase:banned-term");
    expect(result.hardBlocks).toContain("blocked_regex:REF-\\d{4}");
    expect(result.warnings).toContain("watch_phrase:caution-word");
  });

  it("handles invalid regex rules as warnings", () => {
    const result = evaluatePolicyRules({
      text: "test",
      rules: {
        blockedRegex: ["[unclosed"],
      },
    });

    expect(result.hardBlocks).toEqual([]);
    expect(result.warnings).toContain("invalid_rule_regex:[unclosed");
  });
});
