import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireXeroConfig, XERO_AUTHORIZE_URL, XERO_SCOPES } from "@/lib/xero";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const config = requireXeroConfig();
    if (!process.env.AUTH_SECRET) throw new Error("Authentication secret is not configured");
    const state = randomBytes(24).toString("base64url");
    const signature = createHmac("sha256", process.env.AUTH_SECRET).update(state).digest("base64url");
    const url = new URL(XERO_AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("scope", XERO_SCOPES.join(" "));
    url.searchParams.set("state", state);
    const response = NextResponse.redirect(url);
    response.cookies.set("elecplan_xero_state", `${state}.${signature}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/xero/callback", maxAge: 600 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Xero is not configured" }, { status: 503 });
  }
}
