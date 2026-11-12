import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { homeFor, pageAccess } from "@/lib/authz";

// Next.js 16 renamed middleware.ts to proxy.ts. This is the optimistic, page-level guard;
// every API route still re-checks authorization on the server (see lib/api.ts).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const role = req.auth?.user?.role ?? null;

  // Logged-in users don't need the auth pages.
  if (role && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  const decision = pageAccess(pathname, role);
  if (decision === "login") {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if (decision === "forbidden") {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  // New personal accounts go through onboarding once (they can skip it there).
  if (role === "USER" && req.auth?.user && !req.auth.user.onboarded && !pathname.startsWith("/onboarding")) {
    const url = new URL("/onboarding", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  // Skip API routes (they authorize themselves), static files and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|uploads|samples|icons|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)"],
};
