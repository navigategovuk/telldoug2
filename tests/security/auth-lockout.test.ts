import { beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import superjson from "superjson";
import { parseResponse } from "../_shared/envelope";

const executeTransactionMock = vi.fn();

vi.mock("kysely", () => ({
  sql: () => ({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../../helpers/db", () => ({
  db: {
    transaction: () => ({
      execute: executeTransactionMock,
    }),
  },
}));

import { handle } from "../../endpoints/auth/login_with_password_POST";

describe("security: brute-force lockout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).crypto = webcrypto;

    executeTransactionMock.mockImplementation(async (fn: (trx: any) => Promise<any>) => {
      const recentFailureChain = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue({
          failedCount: 5,
          lastFailedAt: new Date().toISOString(),
        }),
      };

      const trx = {
        fn: {
          countAll: () => ({ as: () => "failedCount" }),
          max: () => ({ as: () => "lastFailedAt" }),
        },
        selectFrom: vi.fn((table: string) => {
          if (table === "loginAttempts") {
            return recentFailureChain;
          }
          throw new Error(`Unexpected table in lockout test: ${table}`);
        }),
      };

      return fn(trx);
    });
  });

  it("returns 429 with lockout message after threshold is reached", async () => {
    const request = new Request("http://localhost/_api/auth/login_with_password", {
      method: "POST",
      body: superjson.stringify({ email: "alex@example.com", password: "wrong-password" }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await handle(request);
    const parsed = await parseResponse(response);

    expect(response.status).toBe(429);
    expect(parsed.error.message).toContain("Too many attempts");
  });
});
