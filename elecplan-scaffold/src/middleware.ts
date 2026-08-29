import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess, screenForPath } from "@/lib/access";

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

  return req.headers.get("sec-fetch-site") === "same-origin";
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    // External SMS callbacks cannot be same-origin. This exact endpoint verifies
    // its raw body with a timing-safe HMAC before making any state change.
    if (pathname === "/api/sms/inbound") return NextResponse.next();

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

  if (pathname === "/set-password") return NextResponse.next();

  // Root resolves the user's live tenant, enabled modules and platform status on
  // the Node runtime. Do not guess a landing route from the JWT role alone.
  if (pathname === "/login") {
    if (isLoggedIn && role) return NextResponse.redirect(new URL("/", nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn || !role) {
    const url = new URL("/login", nextUrl);
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") return NextResponse.next();

  const screen = screenForPath(pathname);
  if (screen && !canAccess(role, screen)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
