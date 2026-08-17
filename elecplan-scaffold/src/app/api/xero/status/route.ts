import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { xeroConfigStatus } from "@/lib/xero";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = xeroConfigStatus();
  return NextResponse.json({
    configured: status.configured,
    missing: status.missing,
    connected: false,
    note: status.configured
      ? "Credentials are configured. OAuth tenant connection is the next implementation step."
      : "Configure the missing Xero environment variables before enabling OAuth.",
  });
}
