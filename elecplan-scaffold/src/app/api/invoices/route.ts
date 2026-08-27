import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(240),
  quantity: z.coerce.number().positive().max(100000),
  unitPrice: z.coerce.number().nonnegative().max(10_000_000),
  gstRate: z.coerce.number().min(0).max(1).default(0.1),
});

const invoiceSchema = z.object({
  clientId: z.string().trim().min(1),
  jobId: z.string().trim().optional().nullable(),
  dueDate: z.string().datetime(),
  lineItems: z.array(lineItemSchema).min(1).max(100),
});

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "invoices")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "Select a customer business before viewing invoice data." }, { status: 409 });

  const invoices = await prisma.invoice.findMany({
    where: { businessId: user.businessId, supplier: null },
    include: { client: { select: { name: true } }, job: { select: { title: true } }, lineItems: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "invoices")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "Select a customer business before creating invoice data." }, { status: 409 });
  const businessId = user.businessId;

  const parsed = invoiceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invoice details" }, { status: 400 });
  const data = parsed.data;

  const client = await prisma.client.findFirst({ where: { id: data.clientId, businessId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });

  if (data.jobId) {
    const job = await prisma.job.findFirst({ where: { id: data.jobId, clientId: data.clientId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Selected job does not belong to this business and client" }, { status: 400 });
  }

  const calculated = data.lineItems.map((item) => ({ ...item, lineTotal: item.quantity * item.unitPrice }));
  const subtotal = calculated.reduce((sum, item) => sum + item.lineTotal, 0);
  const gstAmount = calculated.reduce((sum, item) => sum + item.lineTotal * item.gstRate, 0);
  const amount = subtotal + gstAmount;

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          businessId,
          invoiceNumber: invoiceNumber(),
          clientId: data.clientId,
          jobId: data.jobId || null,
          subtotal,
          gstAmount,
          amount,
          dueDate: new Date(data.dueDate),
          status: "UNPAID",
          lineItems: {
            create: calculated.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              gstRate: item.gstRate,
            })),
          },
        },
        include: { client: { select: { name: true } }, job: { select: { title: true } }, lineItems: true },
      });
      if (data.jobId) await tx.job.updateMany({ where: { id: data.jobId, businessId }, data: { status: "INVOICED" } });
      return created;
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create invoice" }, { status: 400 });
  }
}
