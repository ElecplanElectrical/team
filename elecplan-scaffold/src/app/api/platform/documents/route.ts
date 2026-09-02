import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const createSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(1000).nullable().optional(),
  commitToken: z.string().min(1),
});
const selectSql = 'SELECT d.*, b.name AS "businessName" FROM "PlatformDocument" d JOIN "BusinessPortal" b ON b.id = d."businessId"';

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(selectSql + ' ORDER BY d."uploadedAt" DESC');
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Customer, name, type and completed upload are required" }, { status: 400 });
  const p = parsed.data;
  const upload = verifyCommitToken(p.commitToken, "documents");
  if (!upload) return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });
  const business = await prisma.businessPortal.findUnique({ where: { id: p.businessId }, select: { id: true, name: true } });
  if (!business) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    'INSERT INTO "PlatformDocument" ("id","businessId","name","type","storageKey","originalName","contentType","sizeBytes","notes","uploadedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP)',
    id, p.businessId, p.name, p.type, upload.key, upload.fileName, upload.contentType, upload.sizeBytes, p.notes ?? null,
  );
  await recordAudit({
    actor: admin,
    action: "PLATFORM_DOCUMENT_UPLOADED",
    entityType: "PlatformDocument",
    entityId: id,
    details: { businessId: business.id, businessName: business.name, type: p.type, contentType: upload.contentType, sizeBytes: upload.sizeBytes },
  });
  const [created] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(selectSql + " WHERE d.id = $1", id);
  return NextResponse.json(created, { status: 201 });
}
