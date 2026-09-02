import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { recordAudit } from "@/lib/audit";

const createSchema = z.object({
  businessId: z.string().min(1),
  amount: z.number().min(0).max(1000000),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "REFUNDED", "VOID"]).default("PENDING"),
  dueDate: z.string().datetime().nullable().optional(),
  paymentDate: z.string().datetime().nullable().optional(),
  method: z.string().trim().max(80).nullable().optional(),
  reference: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const selectSql = 'SELECT p.*, b.name AS "businessName" FROM "PlatformPayment" p JOIN "BusinessPortal" b ON b.id = p."businessId"';

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(selectSql + ' ORDER BY p."createdAt" DESC');
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  const p = parsed.data;
  const business = await prisma.businessPortal.findUnique({ where: { id: p.businessId }, select: { id: true, name: true } });
  if (!business) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const id = randomUUID();
  const dueDate = p.dueDate ? new Date(p.dueDate) : null;
  const paymentDate = p.paymentDate ? new Date(p.paymentDate) : (p.status === "PAID" ? new Date() : null);
  await prisma.$executeRawUnsafe(
    'INSERT INTO "PlatformPayment" ("id","businessId","amount","status","dueDate","paymentDate","method","reference","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
    id, p.businessId, p.amount, p.status, dueDate, paymentDate, p.method ?? null, p.reference ?? null, p.notes ?? null,
  );
  await recordAudit({
    actor: admin,
    action: "PLATFORM_PAYMENT_RECORDED",
    entityType: "PlatformPayment",
    entityId: id,
    details: { businessId: business.id, businessName: business.name, amount: p.amount, status: p.status },
  });
  const [created] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(selectSql + " WHERE p.id = $1", id);
  return NextResponse.json(created, { status: 201 });
}
