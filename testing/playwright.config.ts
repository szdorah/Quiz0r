import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Global timeout for each test
  timeout: 180000,

  // Timeout for expect() assertions
  expect: {
    timeout: 10000,
  },

  // Test directory
  testDir: "e2e",

  // Output directory for artifacts (screenshots, videos, traces)
  outputDir: ".playwright/results",

  // Run tests in files in parallel
  fullyParallel: false,

  // Limit parallel workers for multi-browser tests
  workers: process.env.CI ? 1 : 2,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: ".playwright/report" }],
    ["list"],
  ],

  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Headless mode control
    headless: !(
      process.env.HEADLESS === "false" ||
      process.env.HEADED === "true"
    ),

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers (optional)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
