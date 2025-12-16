# Roadmap

This is a portfolio project roadmap (what I would build next to make it a sellable SaaS).

## Done (implemented)

- Team-ready foundations:
  - Workspaces + membership roles (`owner` / `member`)
  - Server-enforced RBAC across task/workspace actions
  - Audit logging (incl. `forbidden`) with Settings activity feed + filters
  - Invite links: role selection, expiry/max uses, SHA-256 token hashing, one-time raw link display
  - Invite acceptance hardened with row locks (`FOR UPDATE`) to prevent `maxUses` races
- Production-minded ops:
  - CI runs migrate + lint/i18n/build + Playwright E2E
  - Unsafe flags blocked in production via `preflight:prod`
  - `/api/e2e/*` endpoints disabled in production (always 404)
  - Local Postgres quickstart via `docker-compose.yml` + `npm run db:up`

## Near-term (1–2 weeks)

- Self-serve data deletion from Settings (delete tasks / weekly content / account)
- Basic rate limiting / abuse protection for write endpoints
- Better onboarding and “first run” experience without demo flags (guided tour + seeded sample data per-user)

## Mid-term (1–2 months)

- Billing (Stripe) + plans (Free / Pro / Team)
- Weekly digest scheduling (email/Slack) + richer activity feed UX (export/retention)
- Finer-grained permissions (more roles, per-workspace policy) + admin console

## Longer-term

- Integrations beyond Slack (Notion/Jira/Linear)
- Analytics and insights (completion rate, cycle time, focus adherence)


