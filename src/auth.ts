import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      // Make user id available everywhere (server components, actions, etc.)
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    }
  }
});


