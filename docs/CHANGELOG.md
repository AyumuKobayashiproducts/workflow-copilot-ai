# Changelog

This project uses a simple changelog format for recruiter-friendly review.

## Unreleased

_Nothing yet._

## 1.0.0 - 2025-12-17

- **Security / RBAC / Audit**
  - Server-enforced workspace RBAC (`owner` / `member`) across task and workspace actions
  - Audit logging expanded to include workspace-level events and `forbidden` attempts
  - Workspace invite tokens stored as **SHA-256 hashes** (no raw tokens in DB); raw invite link shown only once after creation
  - Invite acceptance hardened with row locks (`FOR UPDATE`) to prevent `maxUses` race conditions
  - `/api/e2e/*` endpoints disabled in production (always 404 in `production`)

- **Workspace management (Settings)**
  - Owners can rename workspace and remove members with last-owner/self-protection
  - Invite management (create/revoke) and member role changes restricted to owners
  - Settings now shows invite history (status/role/usage) and member “last active” timestamps
  - Activity feed supports filtering by event kind (including grouped filters)

- **Quality / DevEx**
  - E2E preflight to fail fast when DB env vars are missing; CI log noise reduced
  - Playwright stabilized for CI (timeouts/workers tuned)
  - Playwright stabilized for local runs (workers=1; dynamic port; IPv4 bind)
  - CI now runs `npm ci` and includes `npm run build` as a required gate
  - Lint migrated from `next lint` to ESLint CLI (flat config) to remove deprecation warnings
  - Local Postgres via `docker-compose.yml` + `npm run db:up` / `npm run db:down`


