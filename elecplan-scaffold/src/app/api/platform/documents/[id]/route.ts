import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { recordAudit } from "@/lib/audit";
import { deleteStoredObject } from "@/lib/storage";

type DocumentRow = { id: string; businessId: string; businessName: string; storageKey: string; name: string };

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const [document] = await prisma.$queryRawUnsafe<DocumentRow[]>(
    'SELECT d.id,d."businessId",d."storageKey",d.name,b.name AS "businessName" FROM "PlatformDocument" d JOIN "BusinessPortal" b ON b.id=d."businessId" WHERE d.id=$1',
    id,
  );
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  await deleteStoredObject(document.storageKey);
  await prisma.$executeRawUnsafe('DELETE FROM "PlatformDocument" WHERE id=$1', id);
  await recordAudit({
    actor: admin,
    action: "PLATFORM_DOCUMENT_DELETED",
    entityType: "PlatformDocument",
    entityId: id,
    details: { businessId: document.businessId, businessName: document.businessName, name: document.name },
  });
  return NextResponse.json({ ok: true });
}
