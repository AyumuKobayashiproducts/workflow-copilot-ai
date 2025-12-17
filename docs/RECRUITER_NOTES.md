## Recruiter Notes (1-page)

This repository is meant to demonstrate “full-stack SaaS execution” with production guardrails.

### What this app does

Workflow Copilot helps users run a tight loop:

- Inbox capture
- Break down goals into steps
- Weekly review + “Next step” focus
- (Optional) share a weekly report to Slack

### What I’m intentionally showing (engineering)

- **End-to-end ownership**: product flow, auth, DB, CI, and E2E are all included.
- **Production-minded defaults**:
  - CI gates: `lint` / `check:i18n` / `build` / `test:e2e`
  - Postgres migrations run in CI/CD
  - `/api/health` for DB-backed health checks
- **Security**:
  - Server-enforced workspace RBAC (`owner` / `member`)
  - Audit logging including `forbidden` attempts
  - Invite tokens stored as hashes (no raw tokens in DB)
  - E2E-only endpoints disabled in production (defense-in-depth)
- **Testability**:
  - Stable Playwright E2E runs locally and in CI (DB preflight + deterministic behavior)

### Tradeoffs (deliberate)

- Keeps domain model minimal to focus on reliability and observability.
- Roles are intentionally coarse (`owner` / `member`) to prioritize server-enforced correctness over complex UI permissions.

# Recruiter notes (how to evaluate this repo in ~5 minutes)

This repository is a portfolio project intentionally shaped to demonstrate **full-stack execution** with **production-minded guardrails**.

## 1) What problem this solves

Personal task systems often fail at “what should I do next?”.
Workflow Copilot tightens the loop: **Inbox → Breakdown → Weekly review → Next step** (optionally shared to Slack).

## 2) What to look at first (quick links)

- **Architecture overview**: `docs/ARCHITECTURE.md`
- **Security posture**: `docs/SECURITY.md`
- **Deploy/operate mindset**: `docs/RUNBOOK.md`
- **Product direction**: `docs/ROADMAP.md`

## 3) Production-minded signals

- **Auth**: Auth.js / NextAuth v5 with JWT sessions to enable Edge middleware checks.
- **DB migrations committed**: deploy uses `prisma migrate deploy` (see `npm run vercel-build`).
- **Unsafe flags are blocked in prod**: `preflight:prod` fails builds if `AUTH_BYPASS` / `DEMO_TOOLS` / `E2E_TOKEN` are enabled.
- **E2E determinism**: `/api/e2e/reset` enables predictable test state (guarded by flags + token).
- **i18n discipline**: `en.json` and `ja.json` must match; CI enforces key parity.
- **B2B primitives (implemented)**:
  - Workspaces (multi-tenant data scoping) + membership roles (`owner` / `member`)
  - **RBAC is enforced server-side** (not just UI hiding)
  - **Audit log** records both successful events and `forbidden` attempts; Settings has an activity filter
  - Invite links support role selection + expiry + max uses, with usage events logged
- **Security-minded invites**: invite tokens are stored as **SHA-256 hashes** (`tokenHash`), not raw tokens; the raw link is shown only once after creation.
- **Race-aware design**: invite acceptance uses a DB row lock (`FOR UPDATE`) so `maxUses` cannot be exceeded under concurrency.

## 4) What’s intentionally scoped (tradeoffs)

- No billing (Stripe) yet (see roadmap).
- Rate limiting / abuse protection is not fully implemented (documented as a tradeoff).

## 5) Suggested interview prompts

- “How would you evolve this into a team product?” (SCIM/SAML, org-level admin, fine-grained permissions)
- “How would you harden it?” (rate limiting, abuse protection, admin tooling)
- “How do you operate it?” (runbook, incident flow, secret rotation)


