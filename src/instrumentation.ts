import * as Sentry from "@sentry/nextjs";

export function register() {
  // Next.js 15+ requires Sentry.init to run inside an instrumentation file.
  // This runs for both nodejs and edge runtimes.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.0"),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Reduce alert noise: unauthenticated requests can hit server actions/pages with POSTs.
    // Those are expected to be rejected, not treated as production incidents.
    beforeSend(event) {
      const values = event.exception?.values ?? [];
      const first = values[0];
      const type = String(first?.type ?? "");
      const message = String(first?.value ?? "");
      if (type === "UnauthorizedError" || message === "Unauthorized") return null;
      return event;
    }
  });
}

// Next.js server request error instrumentation (Sentry requirement).
export const onRequestError = Sentry.captureRequestError;


