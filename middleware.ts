import { auth } from "@/auth";

export default auth((req) => {
  if (req.auth) return;

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return Response.redirect(url);
});

export const config = {
  matcher: ["/inbox/:path*", "/breakdown/:path*", "/weekly/:path*"]
};


