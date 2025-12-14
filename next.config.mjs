/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // typedRoutes makes `redirect()` expect typed route strings.
  // This project intentionally uses dynamic backUrl strings (e.g. from pathname),
  // so keep typedRoutes disabled to avoid CI/build failures.
};

export default withSentryConfig(nextConfig, {
  // Keep noisy logs off by default; enable in Vercel env if needed.
  silent: true
});


