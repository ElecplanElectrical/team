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
  if (!canAccess(user.role, "projects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const photo = await prisma.projectPhoto.findUnique({
    where: { id },
    select: { storageKey: true, fileUrl: true },
  });
  if (!photo) return NextResponse.json({ error: "Project photo not found" }, { status: 404 });

  if (photo.storageKey) {
    return NextResponse.redirect(createDownloadUrl(photo.storageKey));
  }

  try {
    const legacy = new URL(photo.fileUrl);
    if (legacy.protocol === "https:") return NextResponse.redirect(legacy);
  } catch {
    // Fall through.
  }
  return NextResponse.json({ error: "Project photo is unavailable" }, { status: 404 });
}
