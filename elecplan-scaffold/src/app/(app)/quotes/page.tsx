import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import QuotesView, { type QuoteRow } from "@/components/QuotesView";

function quoteRef(id: string): string {
  return "QT-" + id.slice(-4).toUpperCase();
}

export default async function QuotesPage() {
  await requireAccess("quotes");

  const [quoteRows, clients, jobs] = await Promise.all([
    prisma.quote.findMany({
      include: {
        client: { select: { name: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      select: { id: true, title: true, clientId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const quotes: QuoteRow[] = quoteRows.map((q) => ({
    id: q.id,
    ref: quoteRef(q.id),
    client: q.client.name,
    job: q.job?.title ?? null,
    amount: Number(q.amount),
    status: q.status,
    createdAt: q.createdAt.toISOString(),
  }));

  return <QuotesView quotes={quotes} clients={clients} jobs={jobs} />;
}
