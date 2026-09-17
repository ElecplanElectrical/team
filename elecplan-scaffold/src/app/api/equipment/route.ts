import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { verifyCommitToken } from "@/lib/storage";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(100000).default(1),
  assetNumber: z.string().trim().max(80).optional().nullable(),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  location: z.string().trim().max(160).default("Workshop"),
  notes: z.string().trim().max(1500).optional().nullable(),
  photoCommitToken: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only an admin can add equipment" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid equipment" }, { status: 400 });

  const photo = parsed.data.photoCommitToken ? verifyCommitToken(parsed.data.photoCommitToken, "equipment-photos") : null;
  if (parsed.data.photoCommitToken && !photo) return NextResponse.json({ error: "Photo upload expired. Please choose the photo again." }, { status: 400 });

  try {
    const equipment = await prisma.equipment.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        quantity: parsed.data.quantity,
        assetNumber: parsed.data.assetNumber || null,
        serialNumber: parsed.data.serialNumber || null,
        location: parsed.data.location,
        notes: parsed.data.notes || null,
        ...(photo ? { photoStorageKey: photo.key, photoMimeType: photo.contentType, photoSizeBytes: photo.sizeBytes } : {}),
      },
    });
    return NextResponse.json({ ok: true, id: equipment.id });
  } catch {
    return NextResponse.json({ error: "Could not add equipment. Check the asset number is unique." }, { status: 400 });
  }
}
