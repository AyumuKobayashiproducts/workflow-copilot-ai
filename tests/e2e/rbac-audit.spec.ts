import { test, expect } from "@playwright/test";

const OWNER_ID = "test-user";
const MEMBER_ID = "test-member";

async function setE2EUser(page: Parameters<typeof test>[1] extends (args: infer A) => any ? A["page"] : any, userId: string) {
  // Ensure we know the current origin for cookie domain.
  if (!page.url() || page.url() === "about:blank") {
    await page.goto("/");
  }
  const u = new URL(page.url());
  await page.context().addCookies([
    {
      name: "e2e_user_id",
      value: userId,
      domain: u.hostname,
      path: "/"
    }
  ]);
}

test("rbac+audit: member cannot toggle someone else's task; forbidden is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates a task assigned to owner.
  await page.goto("/inbox?scope=all");
  await setE2EUser(page, OWNER_ID);
  const title = `e2e-rbac-${Date.now()}`;
  await page.goto("/inbox?scope=all");
  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("new-task-submit").click();
  await expect(page.getByTestId("task-item").filter({ hasText: title })).toBeVisible();

  // Member tries to toggle done on owner's task -> forbidden.
  await setE2EUser(page, MEMBER_ID);
  await page.goto("/inbox?scope=all");
  const row = page.getByTestId("task-item").filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /mark done|完了/ }).click();
  await expect(page).toHaveURL(/toast=forbidden/);

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expect(page.locator("text=/Forbidden|権限拒否/")).toBeVisible();
});

test("rbac+audit: member cannot delete someone else's task; forbidden is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates a task.
  await page.goto("/inbox?scope=all");
  await setE2EUser(page, OWNER_ID);
  const title = `e2e-rbac-delete-${Date.now()}`;
  await page.goto("/inbox?scope=all");
  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("new-task-submit").click();
  await expect(page.getByTestId("task-item").filter({ hasText: title })).toBeVisible();

  // Member tries to delete owner's task -> forbidden.
  await setE2EUser(page, MEMBER_ID);
  await page.goto("/inbox?scope=all");
  const row = page.getByTestId("task-item").filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /delete|削除/i }).click();
  await expect(page).toHaveURL(/toast=forbidden/);

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expect(page.locator("text=/Forbidden|権限拒否/")).toBeVisible();
});

test("rbac+audit: member cannot edit someone else's task title; forbidden is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates a task.
  await page.goto("/inbox?scope=all");
  await setE2EUser(page, OWNER_ID);
  const title = `e2e-rbac-title-${Date.now()}`;
  await page.goto("/inbox?scope=all");
  await page.getByTestId("new-task-input").fill(title);
  await page.getByTestId("new-task-submit").click();
  await expect(page.getByTestId("task-item").filter({ hasText: title })).toBeVisible();

  // Member tries to edit owner's task title -> forbidden.
  await setE2EUser(page, MEMBER_ID);
  await page.goto("/inbox?scope=all");
  const row = page.getByTestId("task-item").filter({ hasText: title });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /edit|編集/i }).click();
  const updated = `${title}-x`;
  await row.getByRole("textbox").fill(updated);
  await row.getByRole("button", { name: /save|保存/i }).click();
  await expect(page).toHaveURL(/toast=forbidden/);

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expect(page.locator("text=/Forbidden|権限拒否/")).toBeVisible();
});

test("rbac+audit: member cannot run demo tools; forbidden is logged (workspace event)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Member tries to reset demo data from Settings -> forbidden banner.
  await page.goto("/settings");
  await setE2EUser(page, MEMBER_ID);
  await page.goto("/settings");

  await page.getByRole("button", { name: /reset demo data|デモデータをリセット/i }).click();
  await expect(page).toHaveURL(/demo=forbidden/);

  // Activity feed should show a Forbidden event.
  await expect(page.locator("text=/Forbidden|権限拒否/")).toBeVisible();
});

test("rbac+audit: member cannot create invite; forbidden is logged (workspace event)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/settings");
  await setE2EUser(page, MEMBER_ID);

  const res = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 5 }
  });
  expect(res.status()).toBe(403);
  const json = (await res.json()) as { ok: boolean; error?: string };
  expect(json.ok).toBe(false);
  expect(json.error).toBe("forbidden");

  await page.goto("/settings");
  await expect(page.locator("text=/Forbidden|権限拒否/")).toBeVisible();
});


