import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { exchangeXeroCode, fetchXeroConnections, saveXeroConnection } from "@/lib/xero";
import { recordAudit } from "@/lib/audit";

function validState(queryState: string, cookieValue?: string) {
  if (!cookieValue || !process.env.AUTH_SECRET) return false;
  const [state, signature] = cookieValue.split(".");
  if (!state || !signature || state !== queryState) return false;
  const expected = createHmac("sha256", process.env.AUTH_SECRET).update(state).digest("base64url");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const cookieValue = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("elecplan_xero_state="))?.split("=").slice(1).join("=");
  if (!code || !validState(state, cookieValue)) return NextResponse.json({ error: "Invalid or expired Xero connection request" }, { status: 400 });
  try {
    const tokens = await exchangeXeroCode(code);
    const connections = await fetchXeroConnections(tokens.access_token);
    const named = connections.filter((connection) => /elecplan/i.test(connection.tenantName));
    const selected = connections.length === 1 ? connections[0] : named.length === 1 ? named[0] : null;
    if (!selected) return NextResponse.json({ error: "More than one Xero organisation is connected. Reconnect with only the Elecplan organisation selected." }, { status: 409 });
    await saveXeroConnection(tokens, selected);
    await recordAudit({ actor: user, action: "XERO_CONNECTED", entityType: "XeroConnection", entityId: selected.tenantId, details: { tenantName: selected.tenantName } });
    const response = NextResponse.redirect(new URL("/clients?xero=connected", request.url));
    response.cookies.set("elecplan_xero_state", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/api/xero/callback", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("XERO_CALLBACK_FAILED", error);
    return NextResponse.json({ error: "Could not connect Elecplan to Xero" }, { status: 502 });
  }
}
