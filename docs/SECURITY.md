# Security notes

This document describes security-relevant behavior as implemented in the repository today.

## Authentication & authorization

- GitHub OAuth via **Auth.js / NextAuth v5**
- User data access is scoped by `userId` in server-side reads/writes.

## Environment flags (dangerous)

Never enable these in production:

- `AUTH_BYPASS=1`: bypasses OAuth for E2E/dev convenience.
- `DEMO_TOOLS=1`: enables demo-only buttons/flows.
- `E2E_TOKEN`: should not be set in production (only used to protect local/CI E2E reset).

`scripts/preflight-prod.mjs` is intended to fail builds when forbidden flags are present in production.

See also: `docs/RUNBOOK.md` for a deploy checklist and incident response steps.

## E2E reset endpoint

- `POST /api/e2e/reset` exists for CI/local E2E determinism.
- It should only be enabled when explicitly running in E2E contexts (see route guard conditions).
- It requires a token header (`x-e2e-token`) to reduce accidental abuse in development.

## Data protection

- Data is stored in Postgres via Prisma.
- Deleting a user cascades related records (`onDelete: Cascade` in schema).

## What’s intentionally out of scope (portfolio tradeoffs)

- Rate limiting and abuse protection for public endpoints
- Fine-grained audit logging / admin consoles
- SOC2-style controls


