# Workflow Copilot AI

A small but production-minded Next.js app for an end-to-end personal workflow:
**Inbox → Breakdown → Weekly review → (optional) post to Slack**.

Japanese README: `README.ja.md`

## Problem → Solution

**Problem:** Personal task systems often fail at the “what should I do next?” moment: tasks pile up, weekly reviews are disconnected from execution, and sharing progress is frictionful.

**Solution:** Workflow Copilot keeps the loop tight:
- Capture tasks in **Inbox**
- Turn goals into steps in **Breakdown**
- Review outcomes in **Weekly**
- Pick **one “Next step”** (focus) and optionally share a report to Slack

## What I built (outcomes)

- **End-to-end workflow**: Goal → steps → tasks → weekly review → share
- **AI with guardrails**: daily usage limit, input validation, retry + server-side logging
- **Weekly report persistence**: saved per week (upsert) and editable (manual save)
- **Slack sharing**: Block Kit formatting, clear error reasons, double-submit prevention
- **B2B-ready primitives**: workspace membership + invite links (foundation for team mode)
- **Production ergonomics**: Sentry integration + integration status on Settings + E2E coverage

## Positioning (how this becomes a “sellable” product)

Workflow Copilot is designed for **busy individual contributors** (and small teams) who want a lightweight execution loop:

- Capture everything in **Inbox**
- Convert goals into steps in **Breakdown**
- In **Weekly**, pick exactly **one** “Next step” and optionally share progress to Slack

The portfolio focus is to demonstrate **product thinking + full-stack execution + production guardrails**.

## Differentiators (why it’s “production-minded”)

- **Actionable weekly review**: pick exactly **one Next step** (stored as `Task.focusAt`) and surface it everywhere.
- **Guardrails over “magic”**: validation, deterministic fallbacks, daily AI quota, and explicit error reasons.
- **Operational defaults**: Prisma migrations committed + CI runs DB migrate + Playwright.
- **Observability hooks**: server-side errors are captured with Sentry (configurable).
- **i18n discipline without a library**: missing keys throw and CI enforces key parity.
- **Server-enforced RBAC**: workspace roles (`owner` / `member`) are enforced in server actions (UI is not the gate).
- **Audit trail (incl. forbidden)**: security-relevant actions are written to the workspace activity feed, including denied attempts.
- **Security-minded invites**: workspace invite tokens are stored as **SHA-256 hashes** (no raw tokens in DB); the raw link is shown only once after creation.
- **E2E proof**: Playwright tests cover RBAC enforcement + audit logging across roles (owner/member/outsider).

## Tech stack

- Next.js (App Router) + React
- Auth.js / NextAuth v5 (JWT session strategy + Edge middleware)
- Prisma + Postgres
- Playwright (E2E) + GitHub Actions
- Sentry (optional)

## Live demo

- App: `https://workflow-copilot-ai.vercel.app`
- Login: GitHub OAuth

## 30-second demo flow

Start from `/` (Home) and follow the guided flow:

1. (Optional) `/settings` → **Reset demo data** (quick “first run” experience)
2. `/breakdown` → type a goal → **Generate steps** → **Save to Inbox**
3. `/inbox` → search/filter/sort → complete a task → optionally **edit a task title**
4. `/weekly` → pick one **Next step** → generate & save a weekly report
5. (Optional) **Post to Slack** → see the report in Slack

## Features

- **Auth**: GitHub OAuth (Auth.js / NextAuth v5) + middleware route protection
- **DB persistence**: Prisma + Postgres (migrations included)
- **Inbox**: create / search/filter/sort / edit title / toggle done / delete
- **Breakdown**: goal → steps (MVP generator) → bulk save to Inbox
- **Weekly**: counts + “next step” focus + weekly note/report persistence (saved per week)
- **Slack (optional)**: weekly report via Incoming Webhook
- **i18n (no library)**:
  - Messages are fully separated into `src/messages/en.json` and `src/messages/ja.json`
  - Keys must match (CI check)
  - Missing keys throw (translation omissions are detected immediately)
  - Locale is derived from cookie: `locale=en|ja`

## “Next step” (focus)

Weekly reviews become actionable by selecting exactly **one** top-priority task as the **Next step**.
This is stored as `Task.focusAt` and surfaced in both `/weekly` and `/inbox`.

## Tradeoffs (intentional scope)

- **Simple task model**: minimal fields (title/status/source/focusAt) to keep the workflow tight.
- **Server Actions first**: no complex client state/optimistic updates; correctness and observability take priority.
- **Local dev requires DB**: E2E and persistence assume Postgres is available (CI uses a Postgres service).
- **Coarse-grained roles**: only `owner` / `member` (no custom roles/permissions editor).
- **Lightweight audit UX**: activity feed is intentionally simple (no export/retention controls or admin console).

## Architecture notes (what I’m intentionally showing)

- **App Router + Server Actions** for writes
- **JWT session strategy** so auth checks can run in **Vercel Edge middleware**
- **Prisma migrations committed** so `prisma migrate deploy` can run in CI/CD
- **Typed routes disabled** because this app intentionally uses dynamic back URLs in `redirect()`

## Documentation

- Architecture: `docs/ARCHITECTURE.md`
- Security notes: `docs/SECURITY.md`
- Runbook: `docs/RUNBOOK.md`
- Roadmap: `docs/ROADMAP.md`
- Changelog: `docs/CHANGELOG.md`
- Terms: `/terms` (in-app) + `docs/TERMS.md`
- Privacy: `/privacy` (in-app) + `docs/PRIVACY.md`

## Environment variables

See `docs/env.example`.

Required:

- `DATABASE_URL`
- `PRISMA_DATABASE_URL` (non-pooled URL; used for migrations)
- `AUTH_URL`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Optional:

- `SLACK_WEBHOOK_URL` (Slack Incoming Webhook URL)
- `OPENAI_API_KEY` (enables AI step generation in Breakdown)
- `OPENAI_MODEL` (default: gpt-4o-mini)
- `AI_DAILY_LIMIT` (default: 20, per user per day)
- `SENTRY_DSN` (enables Sentry error reporting)
- `SENTRY_TRACES_SAMPLE_RATE` (default: 0.0)
- `SENTRY_TEST_ENABLED` (optional; enables /sentry-test in production for verification)
- `E2E_TOKEN` (used by Playwright reset API; see E2E section)

## Ops checklist (production-minded)

- **AUTH_BYPASS**: This app supports `AUTH_BYPASS=1` to bypass OAuth for E2E tests.
  - Never enable in production.
- **DEMO_TOOLS**: `DEMO_TOOLS=1` enables “Prepare demo data” buttons.
  - Never enable in production.
- **E2E_TOKEN**: only used to protect the E2E reset endpoint in local/CI contexts.
  - Never set in production.
- **Sentry**: Set `SENTRY_DSN` (and optionally `SENTRY_TRACES_SAMPLE_RATE`) in Vercel to capture errors.
- **Slack**: Set `SLACK_WEBHOOK_URL` to enable Slack posting.
- **OpenAI**: Set `OPENAI_API_KEY` to enable AI generation in Breakdown/Weekly. Keep `AI_DAILY_LIMIT` conservative.

## For recruiters (what to look at first)

- **System overview**: `docs/ARCHITECTURE.md`
- **Security posture**: `docs/SECURITY.md`
- **How I deploy/operate**: `docs/RUNBOOK.md`
- **Product intent**: `docs/ROADMAP.md` + “Tradeoffs” section in this README
- **Review guide**: `docs/RECRUITER_NOTES.md`

## Production deploy checklist

1. Run `npm run preflight:prod` (fails if required env vars are missing or forbidden flags are enabled)
2. Confirm Vercel env vars:
   - Required: `DATABASE_URL`, `PRISMA_DATABASE_URL`, `AUTH_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
   - Optional: `SENTRY_DSN`, `SLACK_WEBHOOK_URL`, `OPENAI_API_KEY`
3. Verify migration deploy runs (Vercel build uses `npm run vercel-build`)
4. Smoke test:
   - `/` loads
   - `/inbox` can add/edit tasks
   - `/weekly` can set Next step and save notes/report

## Local development

### 1) Install

```bash
npm install
```

### 2) Configure env

Create `.env.local` based on `docs/env.example`.

### 3) DB setup

```bash
npm run db:generate
npm run db:migrate
```

### 4) Run

```bash
npm run dev
```

## E2E (Playwright)

CI runs Playwright with a Postgres service. For local E2E you need:

- A running Postgres and valid `DATABASE_URL` / `PRISMA_DATABASE_URL` in `.env.local`
- Browsers installed: `npx playwright install --with-deps chromium`

Local quickstart:

```bash
# 1) DB ready
npm run db:generate
npm run db:migrate

# 2) Install browser once
npx playwright install --with-deps chromium

# 3) Run E2E
npm run test:e2e
```

Notes:

- `npm run test:e2e` runs an E2E preflight and will fail fast if `DATABASE_URL` / `PRISMA_DATABASE_URL` are missing.
- Playwright starts the dev server with `AUTH_BYPASS=1` by default (set `AUTH_BYPASS=0` to test real OAuth).
- Playwright enables `DEMO_TOOLS=1` by default in E2E to test admin-only flows (do not use in prod).
- If you already have `npm run dev` running, Playwright will **reuse the existing server by default** to avoid port conflicts.
  - Set `E2E_REUSE_SERVER=0` if you want Playwright to always start a fresh server.
- You can change the dev server port for E2E with `E2E_PORT` (default: `3000`).
- E2E tests reset the DB state via `POST /api/e2e/reset` (enabled only when `AUTH_BYPASS=1` and always 404 in production).
  - Protect it with `E2E_TOKEN` (default: `e2e`).

## Deploy (Vercel)

### 1) Import repo

Import this repository into Vercel.

### 2) Create Postgres

Create a **Prisma Postgres** database for the Vercel project.
Vercel will populate `DATABASE_URL` and `PRISMA_DATABASE_URL`.

### 3) Configure GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

- Homepage URL: `https://workflow-copilot-ai.vercel.app`
- Authorization callback URL:
  - `https://workflow-copilot-ai.vercel.app/api/auth/callback/github`

Then set env vars in Vercel:

- `AUTH_URL` = `https://workflow-copilot-ai.vercel.app`
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

### 4) Build command

This repo provides:

- `npm run vercel-build` → `prisma generate && prisma migrate deploy && next build`

## Slack (optional)

1. Create an **Incoming Webhook** in Slack
2. Set `SLACK_WEBHOOK_URL` in Vercel (and redeploy)
3. Open `/weekly` → click **Post to Slack**

## CI

GitHub Actions runs:

- `npm run lint`
- `npm run check:i18n` (en/ja keys must match)
- `npm run test:e2e` (Playwright, with Postgres service)

## Scripts

```bash
npm run check:i18n
npm run db:generate
npm run db:migrate
npm run db:deploy
```

## Screenshots

Generate (English UI) screenshots locally:

```bash
npm run screenshots
```

Outputs (written to `docs/screenshots/`):

- `home.png`
- `inbox.png`
- `weekly.png`


