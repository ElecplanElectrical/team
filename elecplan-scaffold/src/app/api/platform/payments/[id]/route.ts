import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE", "REFUNDED", "VOID"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  paymentDate: z.string().datetime().nullable().optional(),
  method: z.string().trim().max(80).nullable().optional(),
  reference: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

type PaymentRow = {
  id: string; businessId: string; businessName: string; status: string;
  dueDate: Date | null; paymentDate: Date | null; method: string | null;
  reference: string | null; notes: string | null;
};

const selectSql = 'SELECT p.*, b.name AS "businessName" FROM "PlatformPayment" p JOIN "BusinessPortal" b ON b.id = p."businessId"';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment update" }, { status: 400 });
  const { id } = await params;
  const [current] = await prisma.$queryRawUnsafe<PaymentRow[]>(selectSql + " WHERE p.id = $1", id);
  if (!current) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  const p = parsed.data;
  const status = p.status ?? current.status;
  const dueDate = p.dueDate === undefined ? current.dueDate : (p.dueDate ? new Date(p.dueDate) : null);
  const paymentDate = p.paymentDate === undefined
    ? (p.status === "PAID" && !current.paymentDate ? new Date() : current.paymentDate)
    : (p.paymentDate ? new Date(p.paymentDate) : null);
  const method = p.method === undefined ? current.method : p.method;
  const reference = p.reference === undefined ? current.reference : p.reference;
  const notes = p.notes === undefined ? current.notes : p.notes;

  await prisma.$executeRawUnsafe(
    'UPDATE "PlatformPayment" SET "status"=$1,"dueDate"=$2,"paymentDate"=$3,"method"=$4,"reference"=$5,"notes"=$6,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$7',
    status, dueDate, paymentDate, method, reference, notes, id,
  );
  await recordAudit({
    actor: admin,
    action: "PLATFORM_PAYMENT_UPDATED",
    entityType: "PlatformPayment",
    entityId: id,
    details: { businessId: current.businessId, businessName: current.businessName, status },
  });
  const [updated] = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(selectSql + " WHERE p.id = $1", id);
  return NextResponse.json(updated);
}
