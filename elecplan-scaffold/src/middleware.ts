import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess, landingPath, screenForPath } from "@/lib/access";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Public, token-gated page: accepting an invite / reset link. Always allowed,
  // even without a session (the token in the URL is the credential).
  if (nextUrl.pathname === "/set-password") {
    return NextResponse.next();
  }

  // Login page: bounce authenticated users to their landing screen.
  if (nextUrl.pathname === "/login") {
    if (isLoggedIn && role) {
      return NextResponse.redirect(new URL(landingPath(role), nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!isLoggedIn || !role) {
    const url = new URL("/login", nextUrl);
    if (nextUrl.pathname !== "/") {
      url.searchParams.set("callbackUrl", nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  // Root -> role landing.
  if (nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(landingPath(role), nextUrl));
  }

  // Role-based access for known screens (defence in depth; pages guard too).
  const screen = screenForPath(nextUrl.pathname);
  if (screen && !canAccess(role, screen)) {
    return NextResponse.redirect(new URL(landingPath(role), nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Next internals, the auth API, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
