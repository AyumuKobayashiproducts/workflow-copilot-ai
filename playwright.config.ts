import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry"
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3000",
        url: "http://localhost:3000",
        // Default to a fresh server to ensure env vars (AUTH_BYPASS etc.) are applied reliably.
        // Set E2E_REUSE_SERVER=1 to speed up local iteration.
        reuseExistingServer: !process.env.CI && process.env.E2E_REUSE_SERVER === "1",
        timeout: 120_000,
        env: {
          ...process.env,
          // E2E focuses on product flows; real OAuth is out of scope for Playwright here.
          // Set AUTH_BYPASS=0 explicitly if you want to test the real login flow.
          AUTH_BYPASS: process.env.AUTH_BYPASS ?? "1",
          E2E_TOKEN: process.env.E2E_TOKEN ?? "e2e",
          SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? "mock",
          AUTH_URL: process.env.AUTH_URL ?? "http://localhost:3000",
          AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret",
          AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ?? "dummy",
          AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ?? "dummy"
        }
      }
});


