## Demo video

This project already has a live demo and E2E coverage; a short demo video helps reviewers understand it in under a minute.

### Goal (what reviewers should learn)

- This is a **production-minded full-stack SaaS** (auth, RBAC, audit logs, Postgres, E2E, CI).
- The core loop works end-to-end: **Breakdown → Inbox → Weekly → Ops/Settings**.

### Recommended format (60–90s)

1) Home (30-second demo steps)
2) Breakdown: goal → add/generate steps → save to Inbox
3) Inbox: add/edit/complete one task
4) Weekly: generate/save report → (optional) Slack post
5) Settings: show RBAC + activity feed (audit log)

### Before recording (recommended)

Pick one of these:

- **Use the hosted demo** (fastest)
  - Open the deployed site.
  - Optional: use the in-app “Prepare demo data” button (enabled by `DEMO_TOOLS=1`).
- **Record locally** (most deterministic)
  - Start Postgres: `npm run db:up`
  - Migrate + seed: `npm run db:migrate && npm run db:seed`
  - Run dev server: `npm run dev`

Keep the UI consistent:

- Use English UI for the video (recommended for recruiters).
- Use a clean browser profile (no extension popups).

### Shot list (click-by-click)

0) **Intro (Home)**
   - Show the app name + quick links.
   - Open `/api/health` in a new tab (1 second) and show `{"ok":true,"db":"ok"}`.

1) **Breakdown**
   - Enter a short goal.
   - Generate steps (or add 2–3 steps manually).
   - Save to Inbox.

2) **Inbox**
   - Edit one task title quickly.
   - Mark it complete.
   - (Optional) Show task detail page.

3) **Weekly**
   - Generate a weekly report.
   - Save it (and optionally “Post to Slack” if configured).

4) **Settings**
   - Show members & roles.
   - Show audit log / recent activity.
   - (Optional) Show invite history (revoked/expired/used).

### Suggested captions (on-screen)

- “Next.js App Router + Server Actions”
- “Auth.js (NextAuth v5)”
- “Postgres + Prisma”
- “RBAC enforced on server”
- “Audit log for security-relevant actions”
- “Playwright E2E + CI”

### Voice-over script (EN, ~60s)

“This is Workflow Copilot AI, a production-minded full-stack SaaS built with Next.js.
You sign in with GitHub, and everything is backed by Postgres via Prisma.
Here’s the core loop: I break down a goal into actionable tasks, save them to Inbox, and track completion.
Weekly reports are generated from activity and can be posted to Slack.
In Settings, roles are enforced server-side with RBAC, and security-relevant actions are recorded in an audit log.
The repo includes E2E tests with Playwright, CI checks, and a health endpoint that proves database connectivity.”

### Voice-over script (JA, ~60s)

「Workflow Copilot AIは、Next.jsで作ったフルスタックSaaSのポートフォリオです。
GitHubログインに対応し、データはPrisma経由でPostgresに保存されます。
まず目標を入力してタスクに分解し、Inboxに保存して実行状況を管理します。
Weeklyでは活動から週次レポートを生成して保存でき、Slack連携も可能です。
SettingsではRBACで権限をサーバ側で強制し、重要操作は監査ログに記録されます。
リポジトリにはPlaywrightのE2E、CIのゲート、DB接続を証明するヘルスチェックも揃えています。」

### Recording tips

- Use a clean browser profile (no extensions popups).
- Keep it fast: do not explain every click; show the loop end-to-end.
- Add captions or a short voice-over.

Recommended settings:

- 1080p (or 1440p), 30fps
- Cursor visible
- Hide personal bookmarks / extensions bar if possible

### Where to publish

- Upload to YouTube (unlisted) or Loom.
- Add the link to README “Quick links” once uploaded.


