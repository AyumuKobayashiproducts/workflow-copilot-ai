/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // typedRoutes makes `redirect()` expect typed route strings.
  // This project intentionally uses dynamic backUrl strings (e.g. from pathname),
  // so keep typedRoutes disabled to avoid CI/build failures.
  //
  // Expose SENTRY_DSN to the client bundle for Sentry browser reporting.
  // (DSN is not a secret; it is safe to be public.)
  env: {
    SENTRY_DSN: process.env.SENTRY_DSN
  }
};

export default withSentryConfig(nextConfig, {
  // Keep noisy logs off by default; enable in Vercel env if needed.
  silent: true
});


