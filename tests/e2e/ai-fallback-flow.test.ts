import { beforeEach, describe, expect, it, vi } from "vitest";
import superjson from "superjson";
import { webcrypto } from "node:crypto";
import { parseResponse } from "../_shared/envelope";

const mocks = vi.hoisted(() => ({
  getServerUserSession: vi.fn(),
  writeAiRun: vi.fn(),
  writeAuditEvent: vi.fn(),
}));

vi.mock("../../helpers/getServerUserSession", () => {
  class ForbiddenError extends Error {
    constructor(message?: string) {
      super(message ?? "Forbidden");
      this.name = "ForbiddenError";
    }
  }

  return {
    getServerUserSession: mocks.getServerUserSession,
    ForbiddenError,
  };
});

vi.mock("../../helpers/getSetServerSession", () => {
  class NotAuthenticatedError extends Error {
    constructor(message?: string) {
      super(message ?? "Not authenticated");
      this.name = "NotAuthenticatedError";
    }
  }

  return {
    NotAuthenticatedError,
  };
});

vi.mock("../../helpers/db", () => ({
  db: {},
}));

vi.mock("../../helpers/audit", () => ({
  writeAiRun: mocks.writeAiRun,
  writeAuditEvent: mocks.writeAuditEvent,
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
    (globalThis as any).crypto = webcrypto;
    mocks.getServerUserSession.mockResolvedValue({
      user: { id: 11 },
      activeOrganizationId: 7,
      activeMembershipRole: "applicant",
      permissions: ["assistant:use"],
    });
    mocks.writeAiRun.mockResolvedValue(undefined);
    mocks.writeAuditEvent.mockResolvedValue(undefined);
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

    expect(mocks.writeAiRun).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "provider_error_fallback" })
    );
    expect(mocks.writeAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ai.fallback" })
    );
  });
});
