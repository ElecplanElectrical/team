import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { deleteStoredObject } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can delete project photos" }, { status: 403 });

  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const { id } = await params;
  const photo = await prisma.projectPhoto.findFirst({
    where: { id, job: { businessId } },
    select: { id: true, jobId: true, storageKey: true },
  });
  if (!photo) return NextResponse.json({ error: "Project photo not found for this business" }, { status: 404 });

  try {
    if (photo.storageKey) await deleteStoredObject(photo.storageKey);
    const deleted = await prisma.projectPhoto.deleteMany({ where: { id: photo.id, job: { businessId } } });
    if (deleted.count !== 1) return NextResponse.json({ error: "Project photo not found for this business" }, { status: 404 });
    await recordAudit({ actor: user, action: "PROJECT_PHOTO_DELETED", entityType: "ProjectPhoto", entityId: photo.id, details: { businessId, jobId: photo.jobId, managedStorage: Boolean(photo.storageKey) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "DELETE_FAILED";
    return NextResponse.json({ error: `Could not delete project photo (${reason})` }, { status: 503 });
  }
}
