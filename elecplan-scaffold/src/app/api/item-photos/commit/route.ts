import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({ target: z.enum(["equipment", "material"]), targetId: z.string().min(1), commitToken: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid photo commit" }, { status: 400 });

  const kind = parsed.data.target === "equipment" ? "equipment-photos" : "material-photos";
  const file = verifyCommitToken(parsed.data.commitToken, kind);
  if (!file) return NextResponse.json({ error: "Upload expired or invalid" }, { status: 400 });

  if (parsed.data.target === "equipment") {
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admin can change equipment photos" }, { status: 403 });
    const item = await prisma.equipment.findUnique({ where: { id: parsed.data.targetId }, select: { id: true } });
    if (!item) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    await prisma.equipment.update({
      where: { id: item.id },
      data: { photoStorageKey: file.key, photoMimeType: file.contentType, photoSizeBytes: file.sizeBytes },
    });
  } else {
    const item = await prisma.material.findUnique({ where: { id: parsed.data.targetId }, select: { id: true } });
    if (!item) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.material.update({ where: { id: item.id }, data: { photoStorageKey: file.key, photoMimeType: file.contentType, photoSizeBytes: file.sizeBytes } }),
      prisma.scanEnrichmentQueue.create({ data: { materialId: item.id, status: "PENDING" } }),
    ]);
  }

  return NextResponse.json({ ok: true, queued: parsed.data.target === "material" });
}
