import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import QuotesView, { type QuoteRow } from "@/components/QuotesView";

function legacyQuoteRef(id: string): string {
  return "QT-" + id.slice(-4).toUpperCase();
}

export default async function QuotesPage() {
  await requireAccess("quotes");

  const [quoteRows, clients, jobs] = await Promise.all([
    prisma.quote.findMany({
      include: {
        client: { select: { name: true } },
        job: { select: { title: true } },
        convertedInvoice: { select: { invoiceNumber: true } },
        lineItems: { select: { id: true } },
        exclusions: { select: { id: true, description: true, convertedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.job.findMany({ select: { id: true, title: true, clientId: true }, orderBy: { createdAt: "desc" } }),
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
    exclusions: q.exclusions.map((item) => ({ id:item.id, description:item.description, convertedAt:item.convertedAt?.toISOString() ?? null })),
    invoiceRef: q.convertedInvoice?.invoiceNumber ?? null,
    createdAt: q.createdAt.toISOString(),
  }));

  return <QuotesView quotes={quotes} clients={clients} jobs={jobs} />;
}
