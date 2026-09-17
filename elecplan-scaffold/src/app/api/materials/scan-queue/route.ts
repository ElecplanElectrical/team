import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const selectionSchema = z.object({
  left: z.number().min(0),
  top: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  imageWidth: z.number().positive(),
  imageHeight: z.number().positive(),
}).optional();

const schema = z.object({
  barcode: z.string().min(1).max(64),
  dataUrl: z.string().startsWith("data:image/jpeg;base64,").max(1800000),
  itemName: z.string().max(160).optional(),
  selection: selectionSchema,
});

function cleanBarcode(value: string) {
  return value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 64);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid queued scan" }, { status: 400 });

  const barcode = cleanBarcode(parsed.data.barcode);
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const key = parsed.data.dataUrl;
  const taughtName = (parsed.data.itemName || "").trim().slice(0, 160);
  let item = await prisma.material.findFirst({ where: { barcode } });

  if (!item) {
    if (!taughtName) return NextResponse.json({ error: "Item name is required for a new barcode" }, { status: 409 });
    item = await prisma.material.create({
      data: { name: taughtName, unit: "each", stockOnHand: 0, reorderPoint: 0, barcode, photoStorageKey: key, photoMimeType: "image/jpeg", photoSizeBytes: Math.floor(key.length * 0.75) },
    });
  } else {
    item = await prisma.material.update({
      where: { id: item.id },
      data: {
        ...(taughtName && item.name !== taughtName ? { name: taughtName } : {}),
        photoStorageKey: key,
        photoMimeType: "image/jpeg",
        photoSizeBytes: Math.floor(key.length * 0.75),
      },
    });
  }

  const job = await prisma.scanEnrichmentQueue.create({
    data: { materialId: item.id, barcode, photoUrl: key, status: "PENDING" },
  });

  await prisma.auditLog.create({
    data: { action: "STOCK_SCAN_QUEUED", entityType: "ScanEnrichmentQueue", entityId: job.id, details: { barcode, selection: parsed.data.selection ?? null } },
  });

  return NextResponse.json({ ok: true, queued: true, jobId: job.id, itemId: item.id, knownName: taughtName || item.name });
}
