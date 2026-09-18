import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { documentStorageKey: true } });
  if (!invoice?.documentStorageKey) return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });
  return NextResponse.redirect(createDownloadUrl(invoice.documentStorageKey));
}
