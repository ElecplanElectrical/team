import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import BillsView, { type BillRow } from "@/components/BillsView";

function billRef(id: string): string {
  return "BL-" + id.slice(-4).toUpperCase();
}

export default async function BillsPage() {
  await requireAccess("bills");

  const [invoiceRows, clients, jobs] = await Promise.all([
    prisma.invoice.findMany({
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

  const bills: BillRow[] = invoiceRows.map((invoice) => ({
    id: invoice.id,
    ref: billRef(invoice.id),
    client: invoice.client?.name ?? null,
    supplier: invoice.supplier,
    job: invoice.job?.title ?? null,
    amount: Number(invoice.amount),
    dueDate: invoice.dueDate.toISOString(),
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
  }));

  return <BillsView bills={bills} clients={clients} jobs={jobs} />;
}
