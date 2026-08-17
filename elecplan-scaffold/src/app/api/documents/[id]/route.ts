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
    return NextResponse.json({ error: "Only admins and supervisors can delete documents" }, { status: 403 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, name: true, jobId: true, storageKey: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  try {
    if (document.storageKey) await deleteStoredObject(document.storageKey);
    await prisma.document.delete({ where: { id } });
    await recordAudit({
      actor: user,
      action: "DOCUMENT_DELETED",
      entityType: "Document",
      entityId: document.id,
      details: { name: document.name, jobId: document.jobId, managedStorage: Boolean(document.storageKey) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "DELETE_FAILED";
    return NextResponse.json({ error: `Could not delete document (${reason})` }, { status: 503 });
  }
}
