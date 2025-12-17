## Contributing

Small, production-minded Next.js app. Contributions are welcome.

### Prerequisites

- Node.js 20+
- Postgres (Docker is supported via `docker-compose.yml`)

### Setup

```bash
npm install
cp docs/env.example .env.local
npm run db:up
npm run db:migrate
```

### Useful scripts

```bash
npm run lint
npm run check:i18n
npm run build
npm run test:e2e
```

### PR checklist

- `npm run lint` passes with zero warnings
- `npm run check:i18n` passes (en/ja keys match)
- `npm run build` passes
- `npm run test:e2e` passes (Playwright)


