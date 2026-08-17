import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { deleteStoredObject } from "@/lib/storage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can delete project photos" }, { status: 403 });
  }

  const { id } = await params;
  const photo = await prisma.projectPhoto.findUnique({
    where: { id },
    select: { id: true, jobId: true, storageKey: true },
  });
  if (!photo) return NextResponse.json({ error: "Project photo not found" }, { status: 404 });

  try {
    if (photo.storageKey) await deleteStoredObject(photo.storageKey);
    await prisma.projectPhoto.delete({ where: { id } });
    await recordAudit({
      actor: user,
      action: "PROJECT_PHOTO_DELETED",
      entityType: "ProjectPhoto",
      entityId: photo.id,
      details: { jobId: photo.jobId, managedStorage: Boolean(photo.storageKey) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "DELETE_FAILED";
    return NextResponse.json({ error: `Could not delete project photo (${reason})` }, { status: 503 });
  }
}
