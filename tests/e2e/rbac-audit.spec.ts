import { test, expect } from "@playwright/test";

const OWNER_ID = "test-user";
const MEMBER_ID = "test-member";
const OUTSIDER_ID = "test-outsider";

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

async function expectActivityHas(page: Parameters<typeof test>[1] extends (args: infer A) => any ? A["page"] : any, re: RegExp) {
  const activitySection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Recent activity|最近の履歴/ }) });
  await expect(activitySection.locator("li").filter({ hasText: re }).first()).toBeVisible();
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
  await row.getByRole("button", { name: /Done|完了/ }).click();
  // URL param may be cleaned immediately; assert the actual toast text instead.
  await expect(page.locator("text=/You do not have permission to do that\\.|権限がありません。/")).toBeVisible();

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expectActivityHas(page, /Forbidden|権限拒否/);
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
  // URL param may be cleaned immediately; assert the actual toast text instead.
  await expect(page.locator("text=/You do not have permission to do that\\.|権限がありません。/")).toBeVisible();

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expectActivityHas(page, /Forbidden|権限拒否/);
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
  const input = row.locator('input[name="title"]');
  await expect(input).toBeVisible();
  await input.fill(updated);
  await row.getByRole("button", { name: /save|保存/i }).click();
  // URL param may be cleaned immediately; assert the actual toast text instead.
  await expect(page.locator("text=/You do not have permission to do that\\.|権限がありません。/")).toBeVisible();

  // Activity feed should show a Forbidden event.
  await page.goto("/settings");
  await expectActivityHas(page, /Forbidden|権限拒否/);
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
  await expectActivityHas(page, /Forbidden|権限拒否/);
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
  await expectActivityHas(page, /Forbidden|権限拒否/);
});

test("rbac+audit: member cannot change member roles; forbidden is logged (workspace event)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/settings");
  await setE2EUser(page, MEMBER_ID);

  const res = await page.request.post("/api/e2e/workspace/member-role", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { userId: MEMBER_ID, role: "owner" }
  });
  expect(res.status()).toBe(403);
  const json = (await res.json()) as { ok: boolean; error?: string };
  expect(json.ok).toBe(false);
  expect(json.error).toBe("forbidden");

  await page.goto("/settings");
  await expectActivityHas(page, /Forbidden|権限拒否/);
});

test("rbac+audit: owner can create invite; event is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);

  const res = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 5 }
  });
  expect(res.status()).toBe(200);
  const json = (await res.json()) as { ok: boolean; token?: string };
  expect(json.ok).toBe(true);
  expect(typeof json.token).toBe("string");

  await page.goto("/settings");
  await expectActivityHas(page, /Invite created|招待リンク作成/);
});

test("rbac+audit: owner can update member role; event is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);

  const res = await page.request.post("/api/e2e/workspace/member-role", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { userId: MEMBER_ID, role: "owner" }
  });
  expect(res.status()).toBe(200);
  const json = (await res.json()) as { ok: boolean };
  expect(json.ok).toBe(true);

  await page.goto("/settings");
  await expectActivityHas(page, /Member role updated|メンバー権限変更/);
});

test("rbac+audit: owner can revoke invite; event is logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);

  const created = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 5 }
  });
  expect(created.status()).toBe(200);

  await page.goto("/settings");
  await page.getByRole("button", { name: /revoke|失効/i }).first().click();

  await page.goto("/settings");
  await expectActivityHas(page, /Invite revoked|招待リンク失効/);
});

test("rbac+audit: member cannot revoke invite; forbidden is logged (workspace event)", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates an invite.
  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);
  const created = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 5 }
  });
  expect(created.status()).toBe(200);
  const createdJson = (await created.json()) as { ok: boolean; token?: string };
  expect(createdJson.ok).toBe(true);
  const inviteToken = String(createdJson.token ?? "");
  expect(inviteToken.length).toBeGreaterThan(10);

  // Member attempts to revoke -> forbidden.
  await setE2EUser(page, MEMBER_ID);
  const res = await page.request.post("/api/e2e/workspace/invite-revoke", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { inviteToken }
  });
  expect(res.status()).toBe(403);
  const json = (await res.json()) as { ok: boolean; error?: string };
  expect(json.ok).toBe(false);
  expect(json.error).toBe("forbidden");

  await page.goto("/settings");
  await expectActivityHas(page, /Forbidden|権限拒否/);
});

test("invite: outsider can accept invite; join events are logged", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates an invite token.
  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);
  const created = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 5 }
  });
  expect(created.status()).toBe(200);
  const createdJson = (await created.json()) as { ok: boolean; token?: string };
  expect(createdJson.ok).toBe(true);
  const token = String(createdJson.token ?? "");
  expect(token.length).toBeGreaterThan(10);

  // Outsider accepts invite via the real page.
  await setE2EUser(page, OUTSIDER_ID);
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(/\/settings\?invite=accepted/);

  // Activity feed should show invite accepted / member joined.
  await expectActivityHas(page, /Invite accepted|招待リンク受諾/);
  await expectActivityHas(page, /Member joined|メンバー参加/);
});

test("invite: usage is audited and used-up is logged when maxUses=1", async ({ page }) => {
  await page.request.post("/api/e2e/reset", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" }
  });

  // Owner creates an invite with maxUses=1.
  await page.goto("/settings");
  await setE2EUser(page, OWNER_ID);
  const created = await page.request.post("/api/e2e/workspace/invite", {
    headers: { "x-e2e-token": process.env.E2E_TOKEN ?? "e2e" },
    data: { role: "member", maxUses: 1 }
  });
  expect(created.status()).toBe(200);
  const createdJson = (await created.json()) as { ok: boolean; token?: string };
  expect(createdJson.ok).toBe(true);
  const token = String(createdJson.token ?? "");
  expect(token.length).toBeGreaterThan(10);

  // Outsider accepts invite.
  await setE2EUser(page, OUTSIDER_ID);
  await page.goto(`/invite/${token}`);
  await expect(page).toHaveURL(/\/settings\?invite=accepted/);

  // Activity feed should show usage + used up.
  await expectActivityHas(page, /Invite used|招待リンク使用/);
  await expectActivityHas(page, /Invite used up|招待リンク上限到達/);
  await expectActivityHas(page, /Invite revoked|招待リンク失効/);
});


