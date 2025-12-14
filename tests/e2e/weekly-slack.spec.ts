import { test, expect } from "@playwright/test";

test("weekly: can post to Slack (mock webhook) and see success message", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/weekly");
  await page.getByTestId("weekly-post-to-slack").click();

  await expect(page.getByText("Posted to Slack.", { exact: true })).toBeVisible();
});


