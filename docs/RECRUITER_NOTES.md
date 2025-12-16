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

## 4) What’s intentionally scoped (tradeoffs)

- No billing (Stripe) yet (see roadmap).
- Rate limiting / abuse protection is not fully implemented (documented as a tradeoff).

## 5) Suggested interview prompts

- “How would you evolve this into a team product?” (SCIM/SAML, org-level admin, fine-grained permissions)
- “How would you harden it?” (rate limiting, abuse protection, admin tooling)
- “How do you operate it?” (runbook, incident flow, secret rotation)


