import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { xeroConfigStatus } from "@/lib/xero";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = xeroConfigStatus();
  const connection = status.configured ? await prisma.xeroConnection.findUnique({ where: { id: "elecplan" }, select: { tenantName: true, lastSyncAt: true } }) : null;
  return NextResponse.json({
    configured: status.configured,
    missing: status.missing,
    connected: Boolean(connection),
    tenantName: connection?.tenantName ?? null,
    lastSyncAt: connection?.lastSyncAt ?? null,
    note: connection
      ? `Connected to ${connection.tenantName}.`
      : status.configured
      ? "Credentials are configured. Connect the Elecplan Xero organisation from Clients."
      : "Configure the missing Xero environment variables before enabling OAuth.",
  });
}
