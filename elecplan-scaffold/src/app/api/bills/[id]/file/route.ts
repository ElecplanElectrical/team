import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

function safeFileName(value: string | null): string {
  return (value || "invoice-document").replace(/[\r\n"\\]/g, "_").slice(0, 180);
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      documentStorageKey: true,
      documentData: true,
      documentMimeType: true,
      documentFileName: true,
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });

  if (invoice.documentStorageKey) {
    return NextResponse.redirect(createDownloadUrl(invoice.documentStorageKey));
  }

  if (invoice.documentData) {
    return new NextResponse(invoice.documentData, {
      status: 200,
      headers: {
        "Content-Type": invoice.documentMimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeFileName(invoice.documentFileName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });
}
