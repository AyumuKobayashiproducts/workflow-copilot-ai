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

## Invite links (token hashing)

- Workspace invites do **not** store raw tokens in the database.
- The app stores `WorkspaceInvite.tokenHash` (SHA-256) and compares by hashing the URL token at accept time.
- The raw invite link is intentionally shown **only once** right after creation (to reduce accidental leakage).

## RBAC policy (workspace roles)

This app uses workspace roles (`owner` / `member`) and enforces permissions in server-side actions.

| Action | Owner | Member |
| --- | --- | --- |
| Create / revoke invite links | ✅ | ❌ |
| Change member roles | ✅ (cannot change own role) | ❌ |
| Assign tasks | ✅ | ❌ |
| Toggle task done | ✅ | ✅ (only if assignee) |
| Edit task title | ✅ | ✅ (only if creator or assignee) |
| Delete task | ✅ | ✅ (only if creator) |
| Demo tools | ✅ | ❌ |

## Audit logging

Security-relevant actions (including `forbidden`) are recorded in `TaskActivity` for the active workspace.

Events (`TaskActivityKind`) currently include:

- Task events: `created`, `title_updated`, `status_toggled`, `assigned`, `focus_set`, `focus_cleared`, `deleted`, `comment`
- Access control: `forbidden`
- Workspace events: `workspace_invite_created`, `workspace_invite_revoked`, `workspace_member_role_updated`
- Invite lifecycle: `workspace_invite_accepted`, `workspace_member_joined`, `workspace_invite_used`, `workspace_invite_used_up`

## What’s intentionally out of scope (portfolio tradeoffs)

- Rate limiting and abuse protection for public endpoints
- Fine-grained audit logging / admin consoles
- SOC2-style controls


