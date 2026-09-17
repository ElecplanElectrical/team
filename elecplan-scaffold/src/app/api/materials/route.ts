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
