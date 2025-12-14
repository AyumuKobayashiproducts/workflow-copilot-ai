import { auth } from "@/auth";

export default auth((req) => {
  // CI/E2E only: allow bypassing auth to keep tests deterministic.
  if (process.env.AUTH_BYPASS === "1") return;
  if (req.auth) return;

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return Response.redirect(url);
});

export const config = {
  matcher: ["/inbox/:path*", "/breakdown/:path*", "/weekly/:path*", "/settings/:path*"]
};


