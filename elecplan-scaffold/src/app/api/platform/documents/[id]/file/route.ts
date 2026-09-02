import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const [document] = await prisma.$queryRawUnsafe<Array<{ storageKey: string }>>(
    'SELECT "storageKey" FROM "PlatformDocument" WHERE id=$1',
    id,
  );
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.redirect(createDownloadUrl(document.storageKey));
}
