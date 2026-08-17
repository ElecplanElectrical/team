import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

function invoiceNumber() {
  const year = new Date().getFullYear();
  return `INV-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "quotes") || !canAccess(user.role, "bills")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lineItems: true, convertedInvoice: { select: { id: true, invoiceNumber: true } } },
  });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Only accepted quotes can be converted" }, { status: 400 });
  }
  if (quote.convertedInvoice) {
    return NextResponse.json({ error: "This quote has already been converted", invoice: quote.convertedInvoice }, { status: 409 });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber: invoiceNumber(),
          sourceQuoteId: quote.id,
          clientId: quote.clientId,
          jobId: quote.jobId,
          subtotal: quote.subtotal ?? quote.amount,
          gstAmount: quote.gstAmount ?? 0,
          amount: quote.amount,
          dueDate,
          status: "UNPAID",
          lineItems: quote.lineItems.length > 0 ? {
            create: quote.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              gstRate: item.gstRate,
            })),
          } : undefined,
        },
        select: { id: true, invoiceNumber: true, amount: true, dueDate: true },
      });

      if (quote.jobId) {
        // Invoicing must not make scheduled or in-progress work disappear from operations.
        // Only promote an already-complete job to the terminal invoiced state.
        await tx.job.updateMany({
          where: { id: quote.jobId, status: "COMPLETE" },
          data: { status: "INVOICED" },
        });
      }
      return created;
    });

    await recordAudit({
      actor: user,
      action: "QUOTE_CONVERTED_TO_INVOICE",
      entityType: "Quote",
      entityId: quote.id,
      details: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        jobId: quote.jobId,
        amount: Number(quote.amount),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not convert quote. It may already have an invoice." }, { status: 409 });
  }
}
