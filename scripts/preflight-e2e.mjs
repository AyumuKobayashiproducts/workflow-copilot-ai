/**
 * E2E preflight checks (local/CI).
 *
 * This is intentionally strict to prevent confusing Prisma stack traces when
 * Playwright starts the dev server without a DB configured.
 */

const required = ["DATABASE_URL", "PRISMA_DATABASE_URL"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("[preflight:e2e] Missing required env vars for E2E:");
  for (const k of missing) console.error(`- ${k}`);
  console.error("");
  console.error("Fix:");
  console.error("- Start Postgres (local) or rely on CI Postgres service");
  console.error("- Set DATABASE_URL and PRISMA_DATABASE_URL (see docs/env.example)");
  console.error("");
  console.error("Example (CI-like):");
  console.error("  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app?schema=public");
  console.error("  PRISMA_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app?schema=public");
  process.exit(1);
}

console.log("[preflight:e2e] OK");


