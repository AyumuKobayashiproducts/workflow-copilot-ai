import { defineConfig } from "@playwright/test";
import * as net from "node:net";

async function isPortFree(port: number) {
  return await new Promise<boolean>((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port, "127.0.0.1");
  });
}

async function pickPort(candidates: number[]) {
  for (const p of candidates) {
    if (await isPortFree(p)) return p;
  }
  return candidates[0] ?? 3001;
}

// Use a separate port by default to avoid clashing with an existing local dev server.
// CI explicitly sets E2E_PORT=3000.
const portFromEnv = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : undefined;
const port = portFromEnv ?? (await pickPort([3001, 3002, 3003, 3100, 3200]));
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const workers = Number(process.env.E2E_WORKERS ?? 1);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // E2E uses a shared DB reset endpoint; parallel workers can interfere with each other.
  // Override explicitly via E2E_WORKERS if you add per-worker isolation in the future.
  workers,
  // CIは起動/DB/migrateで遅くなりがちなので少し余裕を持たせる。
  timeout: process.env.CI ? 90_000 : 60_000,
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: process.env.CI ? 10_000 : 5_000
  },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        // Local dev often already has a server running (avoid EADDRINUSE).
        // If you need a fresh server to ensure env vars are applied, set E2E_REUSE_SERVER=0.
        reuseExistingServer: !process.env.CI && process.env.E2E_REUSE_SERVER !== "0",
        timeout: 120_000,
        env: {
          ...process.env,
          // E2E focuses on product flows; real OAuth is out of scope for Playwright here.
          // Set AUTH_BYPASS=0 explicitly if you want to test the real login flow.
          AUTH_BYPASS: process.env.AUTH_BYPASS ?? "1",
          E2E_TOKEN: process.env.E2E_TOKEN ?? "e2e",
          // Demo tools are useful in E2E to validate admin-only operations and audit logs.
          DEMO_TOOLS: process.env.DEMO_TOOLS ?? "1",
          SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? "mock",
          AUTH_URL: process.env.AUTH_URL ?? baseURL,
          AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret",
          AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ?? "dummy",
          AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ?? "dummy"
        }
      }
});


