/** @type {import('next').NextConfig} */
const nextConfig = {
  // typedRoutes makes `redirect()` expect typed route strings.
  // This project intentionally uses dynamic backUrl strings (e.g. from pathname),
  // so keep typedRoutes disabled to avoid CI/build failures.
};

export default nextConfig;


