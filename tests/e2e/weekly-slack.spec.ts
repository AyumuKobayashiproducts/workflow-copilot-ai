import { test, expect } from "@playwright/test";

test("weekly: can post to Slack (mock webhook) and see success message", async ({ page }) => {
  await page.goto("/weekly");
  await page.getByTestId("weekly-post-to-slack").click();

  await expect(page.getByText("Posted to Slack.", { exact: true })).toBeVisible();
});


