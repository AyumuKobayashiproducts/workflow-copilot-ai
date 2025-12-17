import { defineConfig } from "@playwright/test";
import * as net from "node:net";

async function isPortFree(port: number) {
  return await new Promise<boolean>((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port);
  });
}

async function pickPort(candidates: number[]) {
  for (const p of candidates) {
    if (await isPortFree(p)) return p;
  }
  return candidates[0] ?? 3001;
}

// Use a separate port by default to avoid clashing with an existing local dev server.
const portFromEnv = process.env.SCREENSHOTS_PORT ? Number(process.env.SCREENSHOTS_PORT) : process.env.E2E_PORT ? Number(process.env.E2E_PORT) : undefined;
const candidates = [3001, 3002, 3003, 3004, 3005, 3100, 3200];
const port = await pickPort(portFromEnv ? [portFromEnv, ...candidates.filter((p) => p !== portFromEnv)] : candidates);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

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
        // Force IPv4 bind so 127.0.0.1 baseURL works reliably on Macs.
        command: `npm run dev -- --port ${port} --hostname 127.0.0.1`,
        url: baseURL,
        // Screenshots should be deterministic (DEMO_TOOLS/locale/auth env must apply),
        // so default to a fresh server.
        reuseExistingServer: process.env.SCREENSHOTS_REUSE_SERVER === "1",
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


