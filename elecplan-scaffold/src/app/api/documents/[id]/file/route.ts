import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "documents")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const { id } = await context.params;
  const document = await prisma.document.findFirst({
    where: { id, businessId },
    select: { storageKey: true, fileUrl: true, fileData: true, contentType: true, originalName: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found for this business" }, { status: 404 });

  if (document.storageKey) return NextResponse.redirect(createDownloadUrl(document.storageKey));

  if (document.fileData) {
    const originalName = (document.originalName || "document").replace(/[\r\n"\\]/g, "_");
    return new NextResponse(new Uint8Array(document.fileData), {
      headers: {
        "Content-Type": document.contentType || "application/octet-stream",
        "Content-Length": String(document.fileData.length),
        "Content-Disposition": `inline; filename="${originalName}"; filename*=UTF-8''${encodeURIComponent(document.originalName || "document")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    const legacy = new URL(document.fileUrl);
    if (legacy.protocol === "https:") return NextResponse.redirect(legacy);
  } catch {}

  return NextResponse.json({ error: "Document file is unavailable" }, { status: 404 });
}
