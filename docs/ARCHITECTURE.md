# Architecture

## Goals

- Keep the workflow loop tight: **Inbox → Breakdown → Weekly → Next step**
- Prefer correctness and observability over complex client state
- Make deployments safe: migrations committed, `migrate deploy` in CI/CD

## High-level system

- **Next.js App Router** for UI + routes
- **Server Actions** for writes (task CRUD, weekly notes/reports, demo seeding)
- **Auth.js / NextAuth v5** for GitHub OAuth and session handling
- **Prisma + Postgres** for persistence
- **Playwright** for end-to-end tests

## Data model (Prisma)

Core tables:

- `User`: Auth.js user record
- `Task`: `title`, `status`, optional `source`, optional `focusAt` (the “Next step” marker)
- `WeeklyNote`: per-week note, unique by `(userId, weekStart)`
- `WeeklyReport`: per-week report text, unique by `(userId, weekStart)`
- `AiUsage`: per-user daily quota tracking (by kind)

## Key flows

### Task write path

UI → Server Action → Prisma → redirect/revalidate → UI render

### Weekly “Next step”

Weekly page selects exactly one task → sets `Task.focusAt` → Inbox surfaces focus task at the top.

### E2E reset

`POST /api/e2e/reset` is guarded by environment flags and token headers; it exists to keep local/CI E2E deterministic.


