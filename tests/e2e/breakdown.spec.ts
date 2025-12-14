import { test, expect } from "@playwright/test";

test("breakdown: can generate steps and save them to Inbox", async ({ page }) => {
  await page.goto("/breakdown");

  const goal = `E2E goal ${Date.now()}`;
  await page.getByTestId("breakdown-goal-input").fill(goal);
  await page.getByTestId("breakdown-generate").click();

  // Ensure steps appear
  await expect(page.getByTestId("breakdown-step-input").first()).toBeVisible();

  // Save to inbox
  await page.getByTestId("breakdown-save-to-inbox").click();

  // Verify at least one task exists in inbox
  await page.goto("/inbox");
  await expect(page.getByTestId("task-item").first()).toBeVisible();
});


