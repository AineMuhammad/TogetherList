import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

// Edge/proxy-safe config: no database or bcrypt imports here.
export const authConfig = {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
      const isLoggedIn = !!auth?.user;
      if (isPublic) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
