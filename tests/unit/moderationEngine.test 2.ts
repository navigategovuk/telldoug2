import { beforeEach, describe, expect, it, vi } from "vitest";

const insertIntoMock = vi.fn();
const moderateTextMock = vi.fn();
const getActivePolicyVersionMock = vi.fn();
const evaluatePolicyRulesMock = vi.fn();
const scanPiiMock = vi.fn();
const writeAuditEventMock = vi.fn();

vi.mock("../../helpers/db", () => ({
  db: {
    insertInto: insertIntoMock,
  },
}));

vi.mock("../../helpers/ai", () => ({
  getAiProvider: () => ({
    name: "openai",
    model: "gpt-test",
    moderateText: moderateTextMock,
  }),
}));

vi.mock("../../helpers/policyEngine", () => ({
  getActivePolicyVersion: getActivePolicyVersionMock,
  evaluatePolicyRules: evaluatePolicyRulesMock,
}));

vi.mock("../../helpers/pii", () => ({
  scanPii: scanPiiMock,
}));

vi.mock("../../helpers/audit", () => ({
  writeAuditEvent: writeAuditEventMock,
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

    insertIntoMock.mockImplementation((table: string) => {
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

    getActivePolicyVersionMock.mockResolvedValue({ id: 1, rules: {} });
    evaluatePolicyRulesMock.mockReturnValue({ hardBlocks: [], warnings: [] });
    scanPiiMock.mockReturnValue([]);
    writeAuditEventMock.mockResolvedValue(undefined);
  });

  it("auto-approves low-risk content", async () => {
    moderateTextMock.mockResolvedValue({
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
    expect(writeAuditEventMock).toHaveBeenCalledTimes(1);
  });

  it("queues medium/high risk for review", async () => {
    moderateTextMock.mockResolvedValue({
      flagged: false,
      categories: { harassment: true },
      categoryScores: { harassment: 0.72 },
    });
    evaluatePolicyRulesMock.mockReturnValue({ hardBlocks: [], warnings: ["watch_phrase:x", "watch_phrase:y"] });

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
    moderateTextMock.mockResolvedValue({
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
