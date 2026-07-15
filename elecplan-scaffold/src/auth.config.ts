import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Contains NO database or Node-only imports so it can
 * be used by the Edge middleware. The Credentials provider (which needs Prisma +
 * bcrypt) is added on top of this in `src/auth.ts`, used by the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
