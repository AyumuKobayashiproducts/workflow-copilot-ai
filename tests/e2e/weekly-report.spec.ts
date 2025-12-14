import { test, expect } from "@playwright/test";

test("weekly: can navigate weeks and save edited report (persisted per week)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/weekly");

  // Move to previous week (should change the URL and often change counts)
  await page.getByTestId("weekly-prev-week").click();
  await expect(page).toHaveURL(/\/weekly\?weekStart=/);

  const weekStartParam = new URL(page.url()).searchParams.get("weekStart");
  expect(weekStartParam).toBeTruthy();

  // Generate report (works even without OpenAI key; server returns deterministic report)
  await page.getByTestId("weekly-report-generate").click();
  await expect(page.getByTestId("weekly-report-textarea")).not.toHaveValue("");

  // Edit and save
  const marker = `e2e-saved-${Date.now()}`;
  await page.getByTestId("weekly-report-textarea").fill(`E2E weekly report\n- Highlights: ${marker}\n- Challenges: none\n- Next week: ship`);
  await page.getByTestId("weekly-report-save").click();
  await expect(page.getByText("Report saved.", { exact: true })).toBeVisible();

  // Reload and ensure persisted
  await page.reload();
  await expect(page.getByTestId("weekly-report-textarea")).toHaveValue(new RegExp(marker));

  // Slack post should keep the same weekStart in URL (redirect preserves context)
  await page.getByTestId("weekly-post-to-slack").click();
  await expect(page.getByText("Posted to Slack.", { exact: true })).toBeVisible();
  const afterWeekStartParam = new URL(page.url()).searchParams.get("weekStart");
  expect(afterWeekStartParam).toBe(weekStartParam);
});


