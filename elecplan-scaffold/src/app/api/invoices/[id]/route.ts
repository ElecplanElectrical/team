import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const patchSchema = z.object({ status: z.enum(["UNPAID", "PAID", "OVERDUE"]) });

async function tenantContext() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (!canAccess(user.role, "invoices")) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  if (!user.businessId) return { error: NextResponse.json({ error: "Select a customer business before using invoice data." }, { status: 409 }) } as const;
  return { user, businessId: user.businessId } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await tenantContext();
  if ("error" in ctx) return ctx.error;
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: ctx.businessId, supplier: null },
    include: { client: { select: { id: true, name: true } }, job: { select: { id: true, title: true } }, lineItems: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found for this business" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await tenantContext();
  if ("error" in ctx) return ctx.error;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invoice status" }, { status: 400 });
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, businessId: ctx.businessId, supplier: null }, select: { id: true, jobId: true } });
  if (!existing) return NextResponse.json({ error: "Invoice not found for this business" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: { client: { select: { name: true } }, job: { select: { title: true } }, lineItems: true },
  });
  return NextResponse.json(updated);
}
