import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import BillsView, { type BillRow } from "@/components/BillsView";
import { storageConfigured } from "@/lib/storage";

function billRef(id: string, invoiceNumber: string | null): string {
  return invoiceNumber?.trim() || "BL-" + id.slice(-4).toUpperCase();
}

function effectiveStatus(status: string, dueDate: Date): string {
  if (status === "PAID") return status;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today ? "OVERDUE" : status;
}

export default async function BillsPage() {
  await requireAccess("bills");

  const [invoiceRows, clients, jobs] = await Promise.all([
    prisma.invoice.findMany({
      select: {
        id: true,
        supplier: true,
        invoiceNumber: true,
        amount: true,
        dueDate: true,
        status: true,
        createdAt: true,
        documentStorageKey: true,
        documentSizeBytes: true,
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
    ref: billRef(invoice.id, invoice.invoiceNumber),
    client: invoice.client?.name ?? null,
    supplier: invoice.supplier,
    job: invoice.job?.title ?? null,
    amount: Number(invoice.amount),
    dueDate: invoice.dueDate.toISOString(),
    status: effectiveStatus(invoice.status, invoice.dueDate),
    createdAt: invoice.createdAt.toISOString(),
    hasDocument: Boolean(invoice.documentStorageKey || invoice.documentSizeBytes),
  }));

  return <BillsView bills={bills} clients={clients} jobs={jobs} storageReady={storageConfigured()} />;
}
