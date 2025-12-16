import * as Sentry from "@sentry/nextjs";

export function register() {
  // Next.js 15+ requires Sentry.init to run inside an instrumentation file.
  // This runs for both nodejs and edge runtimes.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.0"),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV
  });
}

// Next.js server request error instrumentation (Sentry requirement).
export const onRequestError = Sentry.captureRequestError;


