import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess, landingPath, screenForPath } from "@/lib/access";

const { auth } = NextAuth(authConfig);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOriginMutation(req: Request): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === new URL(req.url).origin;
    } catch {
      return false;
    }
  }

  // Modern browsers send Sec-Fetch-Site even when Origin is omitted.
  // Only same-origin browser mutations are accepted without Origin.
  return req.headers.get("sec-fetch-site") === "same-origin";
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // API routes keep authorization in their route handlers. Middleware adds a
  // browser same-origin boundary for all state-changing API requests while
  // leaving safe reads alone. Auth.js endpoints are excluded by the matcher.
  if (pathname.startsWith("/api/")) {
    if (!sameOriginMutation(req)) {
      return NextResponse.json(
        { error: "Cross-site request rejected" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Public, token-gated page: accepting an invite / reset link. Always allowed,
  // even without a session (the token in the URL is the credential).
  if (pathname === "/set-password") {
    return NextResponse.next();
  }

  // Login page: bounce authenticated users to their landing screen.
  if (pathname === "/login") {
    if (isLoggedIn && role) {
      return NextResponse.redirect(new URL(landingPath(role), nextUrl));
    }
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!isLoggedIn || !role) {
    const url = new URL("/login", nextUrl);
    if (pathname !== "/") {
      url.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Root -> role landing.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(landingPath(role), nextUrl));
  }

  // Role-based access for known screens (defence in depth; pages guard too).
  const screen = screenForPath(pathname);
  if (screen && !canAccess(role, screen)) {
    return NextResponse.redirect(new URL(landingPath(role), nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Include application APIs for same-origin mutation checks, but leave Auth.js
  // endpoints alone. Static assets and Next internals remain excluded.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
