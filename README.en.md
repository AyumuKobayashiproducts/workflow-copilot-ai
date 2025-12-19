# Workflow Copilot AI (English notes)

[![CI](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/AyumuKobayashiproducts/workflow-copilot-ai/actions/workflows/ci.yml)

English notes are kept as a reference.  
For the main Japanese README, see **`README.md`** (and the detailed version `README.ja.md`).

---

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

## Documentation

See `docs/INDEX.md`.


