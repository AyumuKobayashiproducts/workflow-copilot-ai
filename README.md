# workflow-copilot-ai

Next.js (App Router) MVP with:

- i18n via `src/messages/{en,ja}.json` (keys must match; missing keys throw)
- Locale switching via cookie (`locale=en|ja`)
- Tasks (Inbox) + Breakdown + Weekly
- **Production-like setup**: Auth (GitHub) + Postgres (Prisma) for persistence

## Local setup

### 1) Install

```bash
npm install
```

### 2) Configure env

Copy values from `docs/env.example` into your local env (e.g. `.env.local`).

Required:

- `DATABASE_URL` (Postgres)
- `PRISMA_DATABASE_URL` (Postgres, for migrations)
- `AUTH_SECRET`
- `AUTH_URL` (local: `http://localhost:3000`)
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Optional:

- `SLACK_WEBHOOK_URL` (Incoming Webhook, for posting weekly report)

### 3) Setup DB

```bash
npm run db:generate
npm run db:migrate
```

### 4) Run

```bash
npm run dev
```

## Vercel deploy (high level)

1. Create a Vercel project
2. Add Vercel Postgres (set `DATABASE_URL`)
3. Add env vars (`AUTH_*`)
4. Deploy

Notes:

- Set `AUTH_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`)
- Configure GitHub OAuth callback URL:
  - `https://your-app.vercel.app/api/auth/callback/github`
  - (local) `http://localhost:3000/api/auth/callback/github`

## Useful scripts

```bash
npm run check:i18n
```


