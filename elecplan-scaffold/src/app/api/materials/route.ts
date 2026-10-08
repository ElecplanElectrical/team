import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  onHand: z.number().min(0),
  parLevel: z.number().min(0),
  supplier: z.string().trim().max(120).optional().nullable(),
  photoCommitToken: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 30));

  const items = await prisma.material.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { supplier: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { supplierSku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ],
    } : undefined,
    orderBy: [{ stockOnHand: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      unit: true,
      stockOnHand: true,
      unitCost: true,
      supplier: true,
      sku: true,
      supplierSku: true,
      barcode: true,
    },
  });

  return NextResponse.json(items.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit ?? "each",
    onHand: Number(item.stockOnHand),
    unitCost: Number(item.unitCost ?? 0),
    supplier: item.supplier,
    sku: item.sku,
    supplierSku: item.supplierSku,
    barcode: item.barcode,
  })));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid stock item", issues: parsed.error.flatten() }, { status: 400 });

  const photo = parsed.data.photoCommitToken ? verifyCommitToken(parsed.data.photoCommitToken, "material-photos") : null;
  if (parsed.data.photoCommitToken && !photo) return NextResponse.json({ error: "Photo upload expired. Please choose the photo again." }, { status: 400 });

  try {
    const item = await prisma.material.create({
      data: {
        name: parsed.data.name,
        unit: parsed.data.unit,
        stockOnHand: parsed.data.onHand,
        reorderPoint: parsed.data.parLevel,
        supplier: parsed.data.supplier || null,
        ...(photo ? { photoStorageKey: photo.key, photoMimeType: photo.contentType, photoSizeBytes: photo.sizeBytes } : {}),
      },
    });
    await recordAudit({
      actor: user,
      action: "MATERIAL_CREATED",
      entityType: "Material",
      entityId: item.id,
      details: { name: item.name, unit: item.unit, stockOnHand: Number(item.stockOnHand), reorderPoint: item.reorderPoint == null ? null : Number(item.reorderPoint), hasSupplier: Boolean(item.supplier), hasPhoto: Boolean(photo) },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create stock item" }, { status: 400 });
  }
}
