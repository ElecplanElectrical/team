import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccess, screenForPath } from "@/lib/access";
import type { YourPlanModule } from "@/lib/brand";

const { auth } = NextAuth(authConfig);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PUBLIC_WEBSITE_PATHS = new Set([
  "/",
  "/features",
  "/industries",
  "/pricing",
  "/about",
  "/resources",
  "/contact",
  "/set-password",
]);
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

function portalSlugForHost(hostHeader: string | null): string | null {
  const host = hostHeader?.split(":")[0]?.toLowerCase();
  if (host === "qls.your-plan.com.au") return "qls";
  return null;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const method = req.method.toUpperCase();
  const isDemoSession = req.auth?.user?.demo === true;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;
  const businessSlug = req.auth?.user?.businessSlug;
  const isPlatformAdmin = req.auth?.user?.platformAdmin === true;
  const portalSlug = portalSlugForHost(req.headers.get("host"));
  const portalOrigin = portalSlug === "qls" ? "https://qls.your-plan.com.au" : nextUrl.origin;
  const portalSession = Boolean(portalSlug && isLoggedIn && role && (businessSlug === portalSlug || isPlatformAdmin));

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/sms/inbound") return NextResponse.next();
    if (portalSlug && !portalSession) {
      return NextResponse.json({ error: "This account is not authorised for this business portal" }, { status: 401 });
    }
    if (isDemoSession && !SAFE_METHODS.has(method)) {
      return NextResponse.json({ error: "Demo workspace is read only" }, { status: 403 });
    }
    if (!sameOriginMutation(req)) {
      return NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 });
    }
    return nextWithModule(req, pathname);
  }

  if (pathname.includes(".")) return NextResponse.next();

  if (portalSlug) {
    if (pathname === "/login") {
      if (portalSession) return NextResponse.redirect(new URL("/dashboard", portalOrigin));
      if (nextUrl.searchParams.get("tenant") !== portalSlug || nextUrl.searchParams.get("callbackUrl") !== "/dashboard") {
        const login = new URL("/login", portalOrigin);
        login.searchParams.set("tenant", portalSlug);
        login.searchParams.set("callbackUrl", "/dashboard");
        return NextResponse.redirect(login);
      }
      return NextResponse.next();
    }
    if (pathname === "/set-password") return NextResponse.next();
    if (!portalSession) {
      const login = new URL("/login", portalOrigin);
      login.searchParams.set("tenant", portalSlug);
      login.searchParams.set("callbackUrl", "/dashboard");
      return NextResponse.redirect(login);
    }
    if (pathname === "/" || pathname.startsWith(`/b/${portalSlug}`) || PUBLIC_WEBSITE_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", portalOrigin));
    }
  }

  if (PUBLIC_WEBSITE_PATHS.has(pathname)) return NextResponse.next();
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return NextResponse.next();

  if (pathname === "/login") {
    if (isLoggedIn && role) {
      const callbackUrl = nextUrl.searchParams.get("callbackUrl");
      const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
      return NextResponse.redirect(new URL(safeCallback ?? (portalSlug ? `/b/${portalSlug}/dashboard` : "/"), nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn || !role) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const screen = screenForPath(pathname);
  if (screen && !canAccess(role, screen)) return NextResponse.redirect(new URL("/", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
