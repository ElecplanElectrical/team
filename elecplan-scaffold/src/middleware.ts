import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess, screenForPath } from "@/lib/access";
import type { YourPlanModule } from "@/lib/brand";

const { auth } = NextAuth(authConfig);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const API_MODULE_PREFIXES: Array<[string, YourPlanModule]> = [
  ["/api/jobs", "jobs"],
  ["/api/events", "calendar"],
  ["/api/clients", "clients"],
  ["/api/leads", "leads"],
  ["/api/quotes", "quotes"],
  ["/api/invoices", "invoices"],
  ["/api/users", "employees"],
  ["/api/timesheets", "timesheets"],
  ["/api/inspections", "inspections"],
  ["/api/documents", "documents"],
  ["/api/materials", "materials"],
  ["/api/reminders", "reminders"],
];

function sameOriginMutation(req: Request): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;
  const origin = req.headers.get("origin");
  if (origin) {
    try { return new URL(origin).origin === new URL(req.url).origin; }
    catch { return false; }
  }
  return req.headers.get("sec-fetch-site") === "same-origin";
}

function apiModule(pathname: string): YourPlanModule | null {
  return API_MODULE_PREFIXES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null;
}

function nextWithModule(req: Request, pathname: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-yourplan-required-module");
  const module = apiModule(pathname);
  if (module) requestHeaders.set("x-yourplan-required-module", module);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const method = req.method.toUpperCase();
  const isDemoSession = req.auth?.user?.demo === true;

  if (pathname.startsWith("/api/")) {
    // External SMS callbacks cannot be same-origin. This exact endpoint verifies
    // its raw body with a timing-safe HMAC before making any state change.
    if (pathname === "/api/sms/inbound") return NextResponse.next();
    if (isDemoSession && !SAFE_METHODS.has(method)) {
      return NextResponse.json({ error: "Demo workspace is read only" }, { status: 403 });
    }
    if (!sameOriginMutation(req)) {
      return NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 });
    }
    return nextWithModule(req, pathname);
  }

  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (pathname === "/demo" || pathname.startsWith("/demo/")) return NextResponse.next();
  if (pathname === "/set-password") return NextResponse.next();

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
  if (screen && !canAccess(role, screen)) return NextResponse.redirect(new URL("/", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
