import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "documents")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: { storageKey: true, fileUrl: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (document.storageKey) {
    return NextResponse.redirect(createDownloadUrl(document.storageKey));
  }

  // Legacy records created before managed storage remain readable.
  try {
    const legacy = new URL(document.fileUrl);
    if (legacy.protocol === "https:") return NextResponse.redirect(legacy);
  } catch {
    // Fall through to a controlled not-found response.
  }
  return NextResponse.json({ error: "Document file is unavailable" }, { status: 404 });
}
