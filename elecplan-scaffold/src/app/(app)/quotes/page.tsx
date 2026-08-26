import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import QuotesView, { type QuoteRow } from "@/components/QuotesView";

function legacyQuoteRef(id: string): string {
  return "QT-" + id.slice(-4).toUpperCase();
}

export default async function QuotesPage() {
  const user = await requireAccess("quotes");
  const businessId = user.businessId ?? "__unassigned__";

  const [quoteRows, clients, jobs] = await Promise.all([
    prisma.quote.findMany({
      where: { businessId },
      include: {
        client: { select: { name: true } },
        job: { select: { title: true } },
        convertedInvoice: { select: { invoiceNumber: true } },
        lineItems: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ where: { businessId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.job.findMany({ where: { businessId }, select: { id: true, title: true, clientId: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const quotes: QuoteRow[] = quoteRows.map((q) => ({
    id: q.id,
    ref: q.quoteNumber ?? legacyQuoteRef(q.id),
    client: q.client.name,
    job: q.job?.title ?? null,
    subtotal: q.subtotal == null ? null : Number(q.subtotal),
    gstAmount: q.gstAmount == null ? null : Number(q.gstAmount),
    amount: Number(q.amount),
    status: q.status,
    lineItemCount: q.lineItems.length,
    invoiceRef: q.convertedInvoice?.invoiceNumber ?? null,
    createdAt: q.createdAt.toISOString(),
  }));

  return <QuotesView quotes={quotes} clients={clients} jobs={jobs} />;
}
