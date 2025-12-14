import { test, expect } from "@playwright/test";

test("weekly: can post to Slack (mock webhook) and see success message", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/weekly");
  await page.getByTestId("weekly-post-to-slack").click();

  await expect(page.getByText("Posted to Slack.", { exact: true })).toBeVisible();
});

test("weekly: prevents double submit for Slack post (button disabled while pending)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/weekly");

  const button = page.getByTestId("weekly-post-to-slack");
  await button.click({ noWaitAfter: true });

  // Immediately enters pending state: disabled + label change
  await expect(button).toBeDisabled();
  await expect(button).toHaveText(/Posting…|投稿中…/);

  // Should still eventually succeed (mock webhook)
  await expect(page.getByText("Posted to Slack.", { exact: true })).toBeVisible();
});


