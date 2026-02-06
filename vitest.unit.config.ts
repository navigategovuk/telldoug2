import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "helpers/moderationEngine.tsx",
        "helpers/policyEngine.tsx",
        "helpers/permissions.tsx",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
