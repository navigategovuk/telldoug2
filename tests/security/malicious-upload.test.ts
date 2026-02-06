import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import superjson from "superjson";
import { parseResponse } from "../_shared/envelope";

const mocks = vi.hoisted(() => ({
  requireAnyRole: vi.fn(),
}));

vi.mock("../../helpers/authorize", () => ({
  requireAnyRole: mocks.requireAnyRole,
}));

import { handle } from "../../endpoints/documents/create-upload-url_POST";

describe("security: malicious upload rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).crypto = webcrypto;
    mocks.requireAnyRole.mockResolvedValue({
      activeOrganizationId: 1,
      activeMembershipRole: "applicant",
    });
  });

  it("rejects unsupported MIME types", async () => {
    const request = new Request("http://localhost/_api/documents/create-upload-url", {
      method: "POST",
      body: superjson.stringify({
        applicationId: 10,
        fileName: "exploit.html",
        mimeType: "text/html",
        fileSize: 1024,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(parsed.error.message).toBe("Unsupported file type");
  });

  it("rejects oversized payloads", async () => {
    const request = new Request("http://localhost/_api/documents/create-upload-url", {
      method: "POST",
      body: superjson.stringify({
        applicationId: 10,
        fileName: "big.pdf",
        mimeType: "application/pdf",
        fileSize: 30 * 1024 * 1024,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(parsed.error.message).toBe("File exceeds 25MB limit");
  });
});
