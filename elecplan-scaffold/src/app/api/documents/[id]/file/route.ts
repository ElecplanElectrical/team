import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "documents")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const { id } = await context.params;
  const document = await prisma.document.findFirst({
    where: { id, businessId },
    select: { storageKey: true, fileUrl: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found for this business" }, { status: 404 });

  if (document.storageKey) return NextResponse.redirect(createDownloadUrl(document.storageKey));

  try {
    const legacy = new URL(document.fileUrl);
    if (legacy.protocol === "https:") return NextResponse.redirect(legacy);
  } catch {}

  return NextResponse.json({ error: "Document file is unavailable" }, { status: 404 });
}
