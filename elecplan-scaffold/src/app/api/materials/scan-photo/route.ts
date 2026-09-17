import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  stockItemId: z.string().min(1),
  dataUrl: z.string().startsWith("data:image/jpeg;base64,").max(1800000),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scan photo" }, { status: 400 });

  const item = await prisma.material.findUnique({ where: { id: parsed.data.stockItemId }, select: { id: true, barcode: true } });
  if (!item) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  const key = parsed.data.dataUrl;
  await prisma.$transaction([
    prisma.material.update({
      where: { id: item.id },
      data: {
        photoStorageKey: key,
        photoMimeType: "image/jpeg",
        photoSizeBytes: Math.floor(key.length * 0.75),
      },
    }),
    prisma.scanEnrichmentQueue.create({
      data: {
        materialId: item.id,
        barcode: item.barcode,
        photoUrl: key,
        status: "PENDING",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, queued: true });
}
