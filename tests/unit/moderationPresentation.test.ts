import { describe, expect, it } from "vitest";
import { moderationPresentation, moderationToneColor } from "../../helpers/moderationPresentation";

describe("moderationPresentation", () => {
  it("maps approved decision to success copy", () => {
    const output = moderationPresentation("approved", "Message");
    expect(output.label).toBe("Approved");
    expect(output.tone).toBe("success");
    expect(output.nextStep).toContain("visible");
  });

  it("maps pending decision to warning copy", () => {
    const output = moderationPresentation("pending_review", "Document");
    expect(output.label).toBe("Pending Review");
    expect(output.tone).toBe("warning");
  });

  it("maps blocked decision to danger copy", () => {
    const output = moderationPresentation("blocked", "Submission");
    expect(output.label).toBe("Blocked");
    expect(output.tone).toBe("danger");
    expect(output.nextStep).toContain("hidden");
  });

  it("returns stable color values", () => {
    expect(moderationToneColor("success")).toBe("#0f766e");
    expect(moderationToneColor("warning")).toBe("#92400e");
    expect(moderationToneColor("danger")).toBe("#b91c1c");
  });
});
