import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage() {
  await requireAccess("dashboard");

  const [quotes, invoices, jobs, clients] = await Promise.all([
    prisma.quote.findMany({
      select: { amount: true, status: true },
    }),
    prisma.invoice.findMany({
      select: {
        amount: true,
        status: true,
        clientId: true,
        supplier: true,
        dueDate: true,
      },
    }),
    prisma.job.findMany({
      select: { status: true },
    }),
    prisma.client.count(),
  ]);

  const quotePipeline = quotes
    .filter((q) => q.status === "DRAFT" || q.status === "SENT")
    .reduce((sum, q) => sum + Number(q.amount), 0);
  const acceptedQuotes = quotes
    .filter((q) => q.status === "ACCEPTED")
    .reduce((sum, q) => sum + Number(q.amount), 0);

  const receivables = invoices
    .filter((i) => i.clientId && i.status !== "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const payables = invoices
    .filter((i) => i.supplier && i.status !== "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const paidRevenue = invoices
    .filter((i) => i.clientId && i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const paidSupplierBills = invoices
    .filter((i) => i.supplier && i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const now = new Date();
  const overdueCount = invoices.filter(
    (i) => i.status !== "PAID" && (i.status === "OVERDUE" || i.dueDate < now),
  ).length;

  const activeJobs = jobs.filter(
    (j) => j.status !== "COMPLETE" && j.status !== "INVOICED",
  ).length;
  const completedJobs = jobs.filter(
    (j) => j.status === "COMPLETE" || j.status === "INVOICED",
  ).length;

  return (
    <DashboardView
      metrics={{
        quotePipeline,
        acceptedQuotes,
        receivables,
        payables,
        paidRevenue,
        paidSupplierBills,
        overdueCount,
        activeJobs,
        completedJobs,
        clients,
        quoteCount: quotes.length,
        invoiceCount: invoices.length,
      }}
    />
  );
}
