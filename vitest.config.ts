import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["testing/**/*.test.ts"],
    setupFiles: ["./testing/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "node_modules",
        "testing/unit/mocks/**",
        "testing/**",
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
