import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

test("capture english screenshots (home/inbox/weekly)", async ({ page, baseURL }) => {
  const origin = baseURL ?? "http://localhost:3000";
  const url = new URL(origin);

  // Force English UI.
  await page.context().addCookies([
    {
      name: "locale",
      value: "en",
      domain: url.hostname,
      path: "/"
    }
  ]);

  // Reset DB state (AUTH_BYPASS=1 + E2E reset endpoint).
  const reset = await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });
  if (!reset.ok()) {
    const body = await reset.text().catch(() => "");
    throw new Error(`E2E reset failed: ${reset.status()} ${body.slice(0, 500)}`);
  }

  // Seed demo data (gives "next step" + weekly data).
  await page.goto("/");
  await page.getByTestId("home-seed-demo").click();
  await expect(page.getByText("Demo data is ready.", { exact: true })).toBeVisible();

  const outDir = path.join(process.cwd(), "docs", "screenshots");
  ensureDir(outDir);

  await page.setViewportSize({ width: 1280, height: 720 });

  await page.screenshot({ path: path.join(outDir, "home.png"), fullPage: true });

  await page.goto("/inbox");
  await expect(page.getByText("Top priority (next step)", { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(outDir, "inbox.png"), fullPage: true });

  await page.goto("/weekly");
  await expect(page.getByText("Top priority (next step)", { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(outDir, "weekly.png"), fullPage: true });
});


