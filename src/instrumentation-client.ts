import * as Sentry from "@sentry/nextjs";

export function register() {
  // Client-side init for browser error reporting.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.0"),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV
  });
}

// Next.js App Router navigation instrumentation (Sentry requirement).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;


