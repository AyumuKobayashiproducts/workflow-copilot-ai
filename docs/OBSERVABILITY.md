## Observability

This repo intentionally includes lightweight observability hooks to demonstrate production readiness.

### Health check

The app exposes a simple health endpoint that also probes the DB:

- `GET /api/health`

Example:

```bash
curl -i https://YOUR_DOMAIN/api/health
```

Expected:

- `200` with `{ "ok": true, "db": "ok", ... }` when DB is reachable
- `503` with `{ "ok": false, "db": "error", ... }` when DB is not reachable

### Error monitoring (Sentry)

If you set `SENTRY_DSN` in Vercel, server/edge errors will be reported.

Recommended practice:

- Keep `SENTRY_DSN` enabled in Production.
- Use Vercel Logs to correlate request IDs / timestamps for debugging.


