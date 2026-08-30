import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { createUploadTicket, PHOTO_MAX_BYTES, PHOTO_TYPES, storageConfigured } from "@/lib/storage";

const schema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const business = await prisma.businessPortal.findUnique({ where: { id }, select: { id: true, slug: true, active: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid logo upload request" }, { status: 400 });
  const { fileName, contentType, sizeBytes } = parsed.data;
  if (!PHOTO_TYPES.has(contentType)) return NextResponse.json({ error: "Logo must be PNG, JPEG or WebP" }, { status: 400 });
  if (sizeBytes > PHOTO_MAX_BYTES) return NextResponse.json({ error: "Logo is too large" }, { status: 400 });
  if (!storageConfigured()) return NextResponse.json({ error: "Private storage is not configured yet" }, { status: 503 });
  const ticket = createUploadTicket({ kind: "documents", fileName: `${business.slug}-${fileName}`, contentType, sizeBytes });
  return NextResponse.json(ticket);
}
