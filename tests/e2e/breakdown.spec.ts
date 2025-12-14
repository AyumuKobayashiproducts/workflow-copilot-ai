import { test, expect } from "@playwright/test";

test("breakdown: can generate steps and save them to Inbox", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/breakdown");

  // AI may be disabled in CI/local; this flow uses manual steps for stability.
  await page.getByTestId("breakdown-add-step").click();
  const step = `e2e-step-${Date.now()}`;
  await page.getByTestId("breakdown-step-input").fill(step);

  // Save to inbox
  await page.getByTestId("breakdown-save-to-inbox").click();

  // Verify at least one task exists in inbox
  await page.goto("/inbox");
  await expect(page.getByTestId("task-item").filter({ hasText: step })).toBeVisible();
});


