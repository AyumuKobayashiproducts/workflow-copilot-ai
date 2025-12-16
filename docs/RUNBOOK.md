# Runbook (production-minded checklist)

This runbook is intentionally lightweight and exists to demonstrate “how I operate a small SaaS” in a recruiter-friendly way.

## Build & deploy (Vercel)

### Preconditions

- Vercel project created from this repo
- Postgres provisioned (Vercel Postgres / Prisma Postgres)
- GitHub OAuth App configured

### Required env vars (Production)

- `DATABASE_URL`
- `PRISMA_DATABASE_URL` (non-pooled URL; used for migrations)
- `AUTH_URL` (your production URL)
- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Optional:

- `SENTRY_DSN`
- `SLACK_WEBHOOK_URL`
- `OPENAI_API_KEY`

Forbidden in production (must be unset or `"0"`):

- `AUTH_BYPASS`
- `DEMO_TOOLS`
- `E2E_TOKEN`

### Deploy process

1. Confirm env vars in Vercel → Production.
2. Run production preflight locally (optional) or rely on build-time enforcement:
   - `npm run preflight:prod`
3. Deploy via Vercel (Git push).
4. Confirm the build logs show:
   - `prisma generate`
   - `prisma migrate deploy`
   - `next build`

## Smoke tests (post-deploy)

- `/` loads (no auth bypass in production)
- Sign in with GitHub works
- `/inbox`: create/edit/complete/delete tasks works
- `/weekly`: can set “Next step” and save weekly note/report
- `/settings`: integrations show correct status (Sentry/Slack/OpenAI)
- Confirm `/api/e2e/*` is not reachable in production (`VERCEL_ENV=production` or `NODE_ENV=production`) (should return 404).

## CI (what runs on every PR)

GitHub Actions runs, in order:

- `npm ci`
- `npm run db:generate`
- `npm run db:deploy`
- `npm run lint`
- `npm run check:i18n`
- `npm run build`
- Playwright install + `npm run test:e2e` (with Postgres service)

## Monitoring & alerting

### Sentry (optional)

If `SENTRY_DSN` is set:

- Errors from server/edge should be captured.
- (Optional) enable `SENTRY_TEST_ENABLED` in production to verify `/sentry-test` without re-deploying.
- This repo uses **Next.js 15 instrumentation** (`src/instrumentation.ts` / `src/instrumentation-client.ts`) and a global error boundary (`src/app/global-error.tsx`) to ensure render errors are captured.

### Basic log-based debugging (Vercel)

- Use Vercel Logs for request-level issues (auth callbacks, server actions failures).
- Check Prisma errors first if writes fail (migrations/env URLs).

## Incident response (small app)

### Severity levels

- **SEV1**: login broken or data writes failing for all users
- **SEV2**: major feature degraded (Weekly save, Slack posting)
- **SEV3**: minor bugs / UX issues

### First response checklist

- Identify scope: single user vs all users
- Check recent deploys and revert if needed
- Check env var changes
- Check DB connectivity (`DATABASE_URL`, `PRISMA_DATABASE_URL`)
- Check Auth callback URL / `AUTH_URL`

### Common failure modes

- **DB not configured**: Prisma throws `DATABASE_URL is not set`
  - Fix: set `DATABASE_URL` and `PRISMA_DATABASE_URL` in Vercel Production and re-deploy.
- **OAuth redirect mismatch**
  - Fix: update GitHub OAuth callback URL and ensure `AUTH_URL` matches the deployed domain.
- **Accidentally enabled unsafe flags**
  - Fix: unset `AUTH_BYPASS` / `DEMO_TOOLS` / `E2E_TOKEN` and re-deploy. `preflight:prod` should block this.

## Secret rotation

- Rotate `AUTH_SECRET` if session integrity is suspected.
- Rotate GitHub OAuth client secret if leaked.
- Rotate `OPENAI_API_KEY` and `SLACK_WEBHOOK_URL` if leaked.

## Data deletion (self-host / portfolio)

This repo does not yet provide full self-serve deletion UI.

- Delete the `User` record to cascade related data (tasks, weekly notes/reports, AI usage).
- Confirm foreign-key cascade behavior in Prisma schema before manual deletes.


