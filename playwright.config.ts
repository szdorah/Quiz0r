import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: !(
      process.env.HEADLESS === "false" ||
      process.env.HEADED === "true"
    ),
    trace: "on-first-retry",
  },
  testDir: "tests/e2e",
  retries: 0,
});
