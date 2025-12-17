## Deploy (Vercel)

This repo is set up to deploy cleanly on Vercel using the `vercel-build` script:

- `npm run vercel-build`
  - `node scripts/preflight-prod.mjs`
  - `prisma generate`
  - `prisma migrate deploy`
  - `next build`

### 1) Create a Vercel project

- Import this GitHub repository into Vercel.
- Ensure the framework is detected as **Next.js**.

### 2) Configure Environment Variables (Production)

At minimum, set:

- `DATABASE_URL`
- `PRISMA_DATABASE_URL`
- `AUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `SLACK_WEBHOOK_URL` (or `mock` if you don't want to enable Slack posting)

Optional:

- `OPENAI_API_KEY` (enables AI generation)
- `OPENAI_MODEL`
- `SENTRY_DSN` / related Sentry env vars

See `docs/env.example` for examples.

### 3) Provision Postgres

Use any Postgres provider (Vercel Postgres / Neon / Supabase / RDS).

Make sure:

- The DB user has permission to run migrations.
- `DATABASE_URL` and `PRISMA_DATABASE_URL` point to that database.

### 4) Deploy

- Trigger a deployment (Vercel will run `vercel-build`).
- Verify:
  - App loads
  - Auth works
  - DB migrations were applied
  - `/api/e2e/*` endpoints return 404 in production (defense-in-depth)


