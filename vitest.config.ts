import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reports: ["text", "lcov"],
      exclude: [
        "node_modules",
        "tests/mocks/**",
        "tests/**",
        ".next/**",
        "public/**",
        "scripts/**",
        "**/*.config.*",
        "**/coverage/**",
        "**/.next/**",
        "**/*.d.ts",
        "**/*.js",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
