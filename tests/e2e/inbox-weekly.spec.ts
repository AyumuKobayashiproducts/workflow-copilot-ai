import { test, expect } from "@playwright/test";

test("login bypass: can add task in Inbox and see Weekly reflect it", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  const title = `e2e-task-${Date.now()}`;

  await page.goto("/inbox");

  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("new-task-submit").click();

  await expect(page.getByTestId("task-item").filter({ hasText: title })).toBeVisible();

  await page.goto("/weekly");

  const inProgress = await page.getByTestId("weekly-count-inprogress").innerText();
  expect(Number(inProgress)).toBeGreaterThanOrEqual(1);
});


