import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertInto: vi.fn(),
  moderateText: vi.fn(),
  getActivePolicyVersion: vi.fn(),
  evaluatePolicyRules: vi.fn(),
  scanPii: vi.fn(),
  writeAuditEvent: vi.fn(),
}));

vi.mock("../../helpers/db", () => ({
  db: {
    insertInto: mocks.insertInto,
  },
}));

vi.mock("../../helpers/ai", () => ({
  getAiProvider: () => ({
    name: "openai",
    model: "gpt-test",
    moderateText: mocks.moderateText,
  }),
}));

vi.mock("../../helpers/policyEngine", () => ({
  getActivePolicyVersion: mocks.getActivePolicyVersion,
  evaluatePolicyRules: mocks.evaluatePolicyRules,
}));

vi.mock("../../helpers/pii", () => ({
  scanPii: mocks.scanPii,
}));

vi.mock("../../helpers/audit", () => ({
  writeAuditEvent: mocks.writeAuditEvent,
}));

import { moderateArtifact } from "../../helpers/moderationEngine";

function createInsertChain(executeImpl: () => Promise<any>) {
  return {
    values: vi.fn().mockReturnValue({
      returningAll: vi.fn().mockReturnValue({
        executeTakeFirstOrThrow: executeImpl,
      }),
      execute: executeImpl,
    }),
  };
}

describe("moderationEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.insertInto.mockImplementation((table: string) => {
      if (table === "moderationItems") {
        return createInsertChain(async () => ({ id: 42 }));
      }
      if (table === "moderationEvents") {
        return {
          values: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(undefined),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    mocks.getActivePolicyVersion.mockResolvedValue({ id: 1, rules: {} });
    mocks.evaluatePolicyRules.mockReturnValue({ hardBlocks: [], warnings: [] });
    mocks.scanPii.mockReturnValue([]);
    mocks.writeAuditEvent.mockResolvedValue(undefined);
  });

  it("auto-approves low-risk content", async () => {
    mocks.moderateText.mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: { benign: 0.05 },
    });

    const result = await moderateArtifact({
      organizationId: 1,
      createdByUserId: 10,
      targetType: "message",
      targetId: "msg-1",
      text: "Safe content",
      correlationId: "cid-1",
    });

    expect(result.decision).toBe("approved");
    expect(result.riskScore).toBeLessThan(0.5);
    expect(mocks.writeAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("queues medium/high risk for review", async () => {
    mocks.moderateText.mockResolvedValue({
      flagged: false,
      categories: { spam: true },
      categoryScores: { spam: 0.72 },
    });
    mocks.evaluatePolicyRules.mockReturnValue({ hardBlocks: [], warnings: ["watch_phrase:x", "watch_phrase:y"] });

    const result = await moderateArtifact({
      organizationId: 1,
      createdByUserId: 10,
      targetType: "application_field",
      targetId: "app-1",
      text: "Needs review",
    });

    expect(result.decision).toBe("pending_review");
    expect(result.riskScore).toBeGreaterThanOrEqual(0.5);
  });

  it("blocks severe category content", async () => {
    mocks.moderateText.mockResolvedValue({
      flagged: true,
      categories: { violence: true },
      categoryScores: { violence: 0.98 },
    });

    const result = await moderateArtifact({
      organizationId: 1,
      createdByUserId: 10,
      targetType: "message",
      targetId: "msg-2",
      text: "Severe violation",
    });

    expect(result.decision).toBe("blocked");
  });
});
