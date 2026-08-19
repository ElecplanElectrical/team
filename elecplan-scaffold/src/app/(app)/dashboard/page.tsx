import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardView from "@/components/DashboardView";

function currentWeekStart() {
  const now = new Date();
  const melbourne = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  const day = melbourne.getDay();
  melbourne.setDate(melbourne.getDate() + (day === 0 ? -6 : 1 - day));
  melbourne.setHours(0, 0, 0, 0);
  return melbourne;
}

export default async function DashboardPage() {
  const user = await requireAccess("dashboard");
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [quotes, invoices, jobs, clients, upcomingJobs, reminders, weeklyGoal] = await Promise.all([
    prisma.quote.findMany({ select: { amount: true, status: true } }),
    prisma.invoice.findMany({ select: { amount: true, status: true, clientId: true, supplier: true, dueDate: true, createdAt: true } }),
    prisma.job.findMany({ select: { status: true } }),
    prisma.client.count(),
    prisma.job.findMany({
      where: { scheduledStart: { gte: now }, status: { notIn: ["COMPLETE", "INVOICED"] } },
      orderBy: { scheduledStart: "asc" },
      take: 4,
      select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, status: true, assignedTo: { select: { name: true } }, client: { select: { name: true } } },
    }),
    prisma.reminder.findMany({
      where: { userId: user.id, completed: false },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 6,
      select: { id: true, title: true, dueDate: true, tag: true },
    }),
    prisma.weeklyGoal.findUnique({ where: { weekStart: currentWeekStart() }, select: { text: true } }),
  ]);

  const quotePipeline = quotes.filter((q) => q.status === "DRAFT" || q.status === "SENT").reduce((sum, q) => sum + Number(q.amount), 0);
  const acceptedQuotes = quotes.filter((q) => q.status === "ACCEPTED").reduce((sum, q) => sum + Number(q.amount), 0);
  const receivables = invoices.filter((i) => i.clientId && i.status !== "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const payables = invoices.filter((i) => i.supplier && i.status !== "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const paidRevenue = invoices.filter((i) => i.clientId && i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const paidSupplierBills = invoices.filter((i) => i.supplier && i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const overdueCount = invoices.filter((i) => i.status !== "PAID" && (i.status === "OVERDUE" || i.dueDate < now)).length;
  const activeJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completedJobs = jobs.filter((j) => j.status === "COMPLETE" || j.status === "INVOICED").length;
  const quotedJobs = jobs.filter((j) => j.status === "QUOTED").length;
  const scheduledJobs = jobs.filter((j) => j.status === "SCHEDULED").length;

  const cashSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekAgo); date.setDate(weekAgo.getDate() + index);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const revenue = invoices.filter((i) => i.status === "PAID" && i.clientId && i.createdAt >= date && i.createdAt < next).reduce((sum, i) => sum + Number(i.amount), 0);
    const bills = invoices.filter((i) => i.status === "PAID" && i.supplier && i.createdAt >= date && i.createdAt < next).reduce((sum, i) => sum + Number(i.amount), 0);
    return { label: new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(date), value: revenue - bills };
  });

  return <DashboardView
    metrics={{ quotePipeline, acceptedQuotes, receivables, payables, paidRevenue, paidSupplierBills, overdueCount, activeJobs, completedJobs, quotedJobs, scheduledJobs, clients, quoteCount: quotes.length, invoiceCount: invoices.length }}
    upcomingJobs={upcomingJobs.map((job) => ({ ...job, scheduledStart: job.scheduledStart?.toISOString() ?? null, scheduledEnd: job.scheduledEnd?.toISOString() ?? null, assignedTo: job.assignedTo?.name ?? null, client: job.client.name }))}
    reminders={reminders.map((r) => ({ ...r, dueDate: r.dueDate?.toISOString() ?? null }))}
    weeklyGoal={weeklyGoal?.text ?? ""}
    cashSeries={cashSeries}
  />;
}
