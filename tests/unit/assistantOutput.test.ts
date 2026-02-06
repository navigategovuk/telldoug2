import { describe, expect, it } from "vitest";
import { parseAssistantOutput } from "../../helpers/assistantOutput";

describe("parseAssistantOutput", () => {
  it("extracts citation titles and de-duplicates them", () => {
    const parsed = parseAssistantOutput(
      "Use this policy [Policy: Allocations 2026]. Also see [Policy: Allocations 2026]."
    );

    expect(parsed.citations).toEqual(["Allocations 2026"]);
  });

  it("flags refusal language when final decision content is refused", () => {
    const parsed = parseAssistantOutput(
      "I cannot make a final eligibility decision. Please wait for caseworker review."
    );
    expect(parsed.includesRefusal).toBe(true);
  });

  it("returns no refusal for neutral informational replies", () => {
    const parsed = parseAssistantOutput("Upload evidence before your submission deadline.");
    expect(parsed.includesRefusal).toBe(false);
  });
});
