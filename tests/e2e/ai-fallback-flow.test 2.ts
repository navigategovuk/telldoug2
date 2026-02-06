import { beforeEach, describe, expect, it, vi } from "vitest";
import superjson from "superjson";
import { parseResponse } from "../_shared/envelope";

const getServerUserSessionMock = vi.fn();
const writeAiRunMock = vi.fn();
const writeAuditEventMock = vi.fn();

vi.mock("../../helpers/getServerUserSession", () => ({
  getServerUserSession: getServerUserSessionMock,
}));

vi.mock("../../helpers/db", () => ({
  db: {},
}));

vi.mock("../../helpers/audit", () => ({
  writeAiRun: writeAiRunMock,
  writeAuditEvent: writeAuditEventMock,
}));

vi.mock("../../helpers/ai", () => ({
  getAiProvider: () => ({
    name: "openai",
    model: "gpt-test",
    eligibilityPrecheck: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    moderateText: vi.fn(),
    extractDocument: vi.fn(),
    assistantReply: vi.fn(),
  }),
}));

import { handle } from "../../endpoints/ai/eligibility/precheck_POST";

describe("ai fallback behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerUserSessionMock.mockResolvedValue({
      user: { id: 11 },
      activeOrganizationId: 7,
      activeMembershipRole: "applicant",
      permissions: ["assistant:use"],
    });
    writeAiRunMock.mockResolvedValue(undefined);
    writeAuditEventMock.mockResolvedValue(undefined);
  });

  it("returns pending review-safe outcome and logs audit + ai_run when provider fails", async () => {
    const request = new Request("http://localhost/_api/ai/eligibility/precheck", {
      method: "POST",
      body: superjson.stringify({
        profile: { legalFullName: "Alex Doe" },
        application: { title: "Housing need" },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(parsed.data.providerFallback).toBe(true);
    expect(parsed.data.provisionalOutcome).toBe("uncertain");

    expect(writeAiRunMock).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "provider_error_fallback" })
    );
    expect(writeAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ai.fallback" })
    );
  });
});
