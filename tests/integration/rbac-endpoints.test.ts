import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(process.cwd(), "endpoints");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".schema.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("rbac enforcement markers", () => {
  it("uses authorization guards on protected endpoints", () => {
    const handlers = walk(ROOT);
    const unguarded: string[] = [];

    for (const filePath of handlers) {
      const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");

      // Public routes intentionally unauthenticated.
      if (
        relative.startsWith("auth/login_with_password") ||
        relative.startsWith("auth/register") ||
        relative.startsWith("auth/logout")
      ) {
        continue;
      }

      // Health/liveness and release metadata are intentionally public.
      if (
        relative === "system/health/liveness_GET.ts" ||
        relative === "system/health/readiness_GET.ts" ||
        relative === "system/release/version_GET.ts"
      ) {
        continue;
      }

      const source = fs.readFileSync(filePath, "utf8");
      const hasGuard =
        source.includes("requirePermission(") ||
        source.includes("requireAnyRole(") ||
        source.includes("getServerUserSession(");

      if (!hasGuard) {
        unguarded.push(relative);
      }
    }

    expect(unguarded).toEqual([]);
  });

  it("keeps moderation decision role-gated", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "moderation/decision_POST.ts"),
      "utf8"
    );

    expect(source).toContain("requireAnyRole");
    expect(source).toContain("caseworker");
    expect(source).toContain("platform_admin");
  });
});
