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

describe("tenant isolation contracts", () => {
  it("enforces organization scoping markers across tenant endpoint groups", () => {
    const tenantScopedGroups = [
      "applicant",
      "applications",
      "documents",
      "messages",
      "cases",
      "moderation",
      "ai",
      "audit",
      "metrics",
      "orgs",
    ];

    const handlers = walk(ROOT);
    const missing: string[] = [];

    for (const filePath of handlers) {
      const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
      const group = relative.split("/")[0];
      if (!tenantScopedGroups.includes(group)) {
        continue;
      }

      // Public auth entrypoints are intentionally outside organization context.
      if (relative.startsWith("auth/login_with_password") || relative.startsWith("auth/register")) {
        continue;
      }

      const source = fs.readFileSync(filePath, "utf8");
      const hasOrgScopeMarker = /activeOrganizationId|organizationId/.test(source);
      if (!hasOrgScopeMarker) {
        missing.push(relative);
      }
    }

    expect(missing).toEqual([]);
  });
});
