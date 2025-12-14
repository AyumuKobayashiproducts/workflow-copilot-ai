import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Vercel runs behind proxies; trustHost avoids "Untrusted Host" issues.
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET ?? ""
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // Make user id available everywhere (server components, actions, etc.)
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    }
  }
});


