import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/accessibility/**/*.test.ts", "tests/accessibility/**/*.test.tsx"],
    environment: "node",
  },
});
