# Workflow Copilot AI

A small but production-minded Next.js app for an end-to-end personal workflow:
**Inbox → Breakdown → Weekly review → (optional) post to Slack**.

## What I built (outcomes)

- **End-to-end workflow**: Goal → steps → tasks → weekly review → share
- **AI with guardrails**: daily usage limit, input validation, retry + server-side logging
- **Weekly report persistence**: saved per week (upsert) and editable (manual save)
- **Slack sharing**: Block Kit formatting, clear error reasons, double-submit prevention
- **Production ergonomics**: Sentry integration + integration status on Settings + E2E coverage

## Live demo

- App: `https://workflow-copilot-ai.vercel.app`
- Login: GitHub OAuth

## 日本語：デモ手順（最短）

1. `/settings` → **Reset demo data**（デモ用データを準備）
2. `/breakdown` → 目標入力 → **Generate steps** → **Save to Inbox**
3. `/inbox` → タスクを1つ完了にする
4. `/weekly` → **Generate report** →（必要なら編集）→ **Save** → **Post to Slack**

## 30-second demo flow

1. Login with GitHub
2. Go to **Breakdown** → type a goal → generate steps → **Save to Inbox**
3. Go to **Inbox** → add / complete / delete tasks
4. Go to **Weekly** → verify counts and notes persistence
5. (Optional) Click **Post to Slack** → see the weekly report in Slack

## Features

- **Auth**: GitHub OAuth (Auth.js / NextAuth v5) + middleware route protection
- **DB persistence**: Prisma + Postgres (migrations included)
- **Inbox**: create / toggle done / delete
- **Breakdown**: goal → steps (MVP generator) → bulk save to Inbox
- **Weekly**: counts + weekly note/report persistence (saved per week)
- **Slack (optional)**: weekly report via Incoming Webhook
- **i18n (no library)**:
  - Messages are fully separated into `src/messages/en.json` and `src/messages/ja.json`
  - Keys must match (CI check)
  - Missing keys throw (translation omissions are detected immediately)
  - Locale is derived from cookie: `locale=en|ja`

## Architecture notes (what I’m intentionally showing)

- **App Router + Server Actions** for writes
- **JWT session strategy** so auth checks can run in **Vercel Edge middleware**
- **Prisma migrations committed** so `prisma migrate deploy` can run in CI/CD
- **Typed routes disabled** because this app intentionally uses dynamic back URLs in `redirect()`

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
- **Sentry**: Set `SENTRY_DSN` (and optionally `SENTRY_TRACES_SAMPLE_RATE`) in Vercel to capture errors.
- **Slack**: Set `SLACK_WEBHOOK_URL` to enable Slack posting.
- **OpenAI**: Set `OPENAI_API_KEY` to enable AI generation in Breakdown/Weekly. Keep `AI_DAILY_LIMIT` conservative.

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

Notes:

- Playwright starts the dev server with `AUTH_BYPASS=1` by default (set `AUTH_BYPASS=0` to test real OAuth).
- E2E tests reset the DB state via `POST /api/e2e/reset` (enabled only when `AUTH_BYPASS=1`).
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

## Scripts

```bash
npm run check:i18n
npm run db:generate
npm run db:migrate
npm run db:deploy
```

## Screenshots

![Login](docs/screenshots/login.png)

![Weekly report in Slack](docs/screenshots/slack-weekly.png)


