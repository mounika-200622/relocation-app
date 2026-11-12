import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/lib/authz";

/**
 * Part of the NextAuth config without Prisma/bcrypt, shared with proxy.ts.
 * The JWT carries id + role so pages and the proxy never need an extra /api/me call.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = Number(user.id);
        token.role = user.role;
        token.onboarded = user.onboarded ?? true;
      }
      // The client calls update({ onboarded: true }) / update({ name }) after editing the profile.
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { onboarded?: boolean; name?: string };
        if (typeof s.onboarded === "boolean") token.onboarded = s.onboarded;
        if (typeof s.name === "string") token.name = s.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // The callback's param type merges AdapterUser (string id); our Session uses a number id.
        Object.assign(session.user, {
          id: Number(token.id),
          role: token.role as AppRole,
          onboarded: Boolean(token.onboarded),
        });
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
