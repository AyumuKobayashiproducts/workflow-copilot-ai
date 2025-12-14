import { test, expect } from "@playwright/test";

test("login bypass: can add task in Inbox and see Weekly reflect it", async ({ page }) => {
  const title = `e2e-task-${Date.now()}`;

  await page.goto("/inbox");

  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("new-task-submit").click();

  await expect(page.getByTestId("task-item").filter({ hasText: title })).toBeVisible();

  await page.goto("/weekly");

  const inProgress = await page.getByTestId("weekly-count-inprogress").innerText();
  expect(Number(inProgress)).toBeGreaterThanOrEqual(1);
});


