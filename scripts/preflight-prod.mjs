/**
 * Production preflight checks.
 *
 * Usage:
 *   node scripts/preflight-prod.mjs
 */

const required = [
  "DATABASE_URL",
  "PRISMA_DATABASE_URL",
  "AUTH_URL",
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET"
];

const forbiddenTruthies = [
  ["AUTH_BYPASS", "1"],
  ["DEMO_TOOLS", "1"]
];

function isTruthy(v) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

const missing = required.filter((k) => !process.env[k]);
const forbidden = forbiddenTruthies.filter(([k, bad]) => String(process.env[k] ?? "").trim() === bad);

if (missing.length) {
  console.error("[preflight] Missing required env vars:");
  for (const k of missing) console.error(`- ${k}`);
}

if (forbidden.length) {
  console.error("[preflight] Forbidden production flags detected:");
  for (const [k] of forbidden) console.error(`- ${k}=${process.env[k]}`);
  console.error("These should never be enabled in production.");
}

const slack = String(process.env.SLACK_WEBHOOK_URL ?? "");
if (slack === "mock" && isTruthy(process.env.CI ?? "")) {
  // In CI mock is expected; in production this is useless.
  console.warn("[preflight] SLACK_WEBHOOK_URL is set to 'mock'. This disables real Slack posting.");
}

if (!process.env.SENTRY_DSN) {
  console.warn("[preflight] SENTRY_DSN is not set (optional). Errors will not be reported to Sentry.");
}

if (missing.length || forbidden.length) process.exit(1);
console.log("[preflight] OK");


