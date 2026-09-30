import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(240),
  quantity: z.coerce.number().positive().max(100000),
  unitPrice: z.coerce.number().nonnegative().max(10_000_000),
  gstRate: z.coerce.number().min(0).max(1).default(0.1),
});

const invoiceSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  jobId: z.string().trim().optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lineItems: z.array(lineItemSchema).min(1).max(100),
});

function invoiceNumber() {
  const year = new Date().getFullYear();
  return `INV-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "invoices")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = invoiceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice details" }, { status: 400 });
  }

  const data = parsed.data;
  const dueDate = new Date(`${data.dueDate}T12:00:00.000Z`);
  if (Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }

  let linkedJob: { id: string; clientId: string; client: { name: string } } | null = null;
  if (data.jobId) {
    linkedJob = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, clientId: true, client: { select: { name: true } } },
    });

    if (!linkedJob) {
      return NextResponse.json({ error: "Selected job was not found" }, { status: 404 });
    }

    if (linkedJob.client.name.trim().toLowerCase() !== data.customerName.trim().toLowerCase()) {
      return NextResponse.json({ error: "Selected job belongs to a different customer" }, { status: 400 });
    }
  }

  const calculated = data.lineItems.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }));
  const subtotal = calculated.reduce((sum, item) => sum + item.lineTotal, 0);
  const gstAmount = calculated.reduce((sum, item) => sum + item.lineTotal * item.gstRate, 0);
  const amount = subtotal + gstAmount;

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      let clientId = linkedJob?.clientId ?? null;

      if (!clientId) {
        const existingClient = await tx.client.findFirst({
          where: { name: { equals: data.customerName, mode: "insensitive" } },
          select: { id: true },
        });

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const newClient = await tx.client.create({
            data: { name: data.customerName },
            select: { id: true },
          });
          clientId = newClient.id;
        }
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: invoiceNumber(),
          clientId,
          jobId: linkedJob?.id ?? null,
          subtotal,
          gstAmount,
          amount,
          dueDate,
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
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          dueDate: true,
          clientId: true,
          jobId: true,
        },
      });
    });

    await recordAudit({
      actor: user,
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        jobId: invoice.jobId,
        amount: Number(invoice.amount),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create invoice" }, { status: 400 });
  }
}
