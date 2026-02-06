import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import superjson from "superjson";
import { parseResponse } from "../_shared/envelope";

const mocks = vi.hoisted(() => ({
  requireAnyRole: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("../../helpers/authorize", () => ({
  requireAnyRole: mocks.requireAnyRole,
}));

vi.mock("../../helpers/db", () => ({
  db: {
    insertInto: () => ({
      values: mocks.insertValues,
    }),
  },
}));

import { handle } from "../../endpoints/audit/release-marker_POST";

describe("release marker service token mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).crypto = webcrypto;
    process.env.RELEASE_MARKER_TOKEN = "test-token";
    process.env.RELEASE_MARKER_ORG_ID = "1";

    mocks.insertValues.mockReturnValue({
      returning: () => ({
        executeTakeFirstOrThrow: vi.fn().mockResolvedValue({
          id: 9001,
          createdAt: new Date().toISOString(),
        }),
      }),
    });
  });

  it("accepts service token and writes release marker without platform session", async () => {
    const request = new Request("http://localhost/_api/audit/release-marker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-release-marker-token": "test-token",
      },
      body: superjson.stringify({
        version: "1.2.3",
        environment: "staging",
        commitSha: "abcdef12345",
        imageDigest: "sha256:abc123456789",
        migrationVersion: "202602060900_init.sql",
        organizationId: 22,
      }),
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(200);
    expect(parsed.data.marker.version).toBe("1.2.3");
    expect(mocks.requireAnyRole).not.toHaveBeenCalled();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 22,
        actorUserId: null,
        eventType: "release.marker",
      })
    );
  });

  it("rejects service-token requests that do not resolve organization id", async () => {
    process.env.RELEASE_MARKER_ORG_ID = "";
    const request = new Request("http://localhost/_api/audit/release-marker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-release-marker-token": "test-token",
      },
      body: superjson.stringify({
        version: "1.2.3",
        environment: "dev",
        commitSha: "abcdef12345",
        imageDigest: "sha256:abc123456789",
        migrationVersion: "202602060900_init.sql",
      }),
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(400);
    expect(parsed.error.message).toContain("organizationId is required");
  });
});
