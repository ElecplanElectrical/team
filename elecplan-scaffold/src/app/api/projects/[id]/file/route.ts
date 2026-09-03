import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "projects")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const { id } = await context.params;
  const photo = await prisma.projectPhoto.findFirst({
    where: { id, job: { businessId } },
    select: { storageKey: true, fileUrl: true, fileData: true, contentType: true, originalName: true },
  });
  if (!photo) return NextResponse.json({ error: "Project photo not found for this business" }, { status: 404 });

  if (photo.storageKey) return NextResponse.redirect(createDownloadUrl(photo.storageKey));

  if (photo.fileData) {
    const originalName = (photo.originalName || "project-photo").replace(/[\r\n"\\]/g, "_");
    return new NextResponse(new Uint8Array(photo.fileData), { headers: { "Content-Type": photo.contentType || "image/jpeg", "Content-Length": String(photo.fileData.length), "Content-Disposition": `inline; filename="${originalName}"`, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  }

  try {
    const legacy = new URL(photo.fileUrl);
    if (legacy.protocol === "https:") return NextResponse.redirect(legacy);
  } catch {}

  return NextResponse.json({ error: "Project photo is unavailable" }, { status: 404 });
}
