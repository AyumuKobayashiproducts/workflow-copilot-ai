import { defineConfig } from "@playwright/test";

// Use a separate port by default to avoid clashing with an existing local dev server.
const port = Number(process.env.SCREENSHOTS_PORT ?? process.env.E2E_PORT ?? 3001);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/screenshots",
  fullyParallel: false,
  reporter: "line",
  retries: 0,
  use: {
    baseURL,
    trace: "off"
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        // Screenshots should be deterministic (DEMO_TOOLS/locale/auth env must apply),
        // so default to a fresh server.
        reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
        timeout: 120_000,
        env: {
          ...process.env,
          AUTH_BYPASS: process.env.AUTH_BYPASS ?? "1",
          E2E_TOKEN: process.env.E2E_TOKEN ?? "e2e",
          SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? "mock",
          AUTH_URL: process.env.AUTH_URL ?? baseURL,
          AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret",
          AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ?? "dummy",
          AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ?? "dummy",
          // Ensure the "Prepare demo data" CTA is available for nice screenshots.
          DEMO_TOOLS: process.env.DEMO_TOOLS ?? "1"
        }
      }
});


