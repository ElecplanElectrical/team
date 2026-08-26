import AnalyticsView from "@/components/AnalyticsView";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

export default async function AnalyticsPage() {
  const user = await requireAccess("analytics");
  const businessId = user.businessId ?? "__unassigned__";

  const [leads, quotes, invoices, jobs, reviews, timesheets] = await Promise.all([
    prisma.lead.findMany({ where: { businessId }, select: { stage: true, value: true } }),
    prisma.quote.findMany({ where: { businessId }, select: { status: true, amount: true } }),
    prisma.invoice.findMany({ where: { businessId }, select: { status: true, amount: true, clientId: true, supplier: true, dueDate: true } }),
    prisma.job.findMany({ where: { businessId }, select: { status: true } }),
    prisma.review.findMany({ where: { client: { businessId } }, select: { rating: true } }),
    prisma.timesheet.findMany({ where: { businessId }, select: { status: true, hours: true } }),
  ]);

  const wonLeads = leads.filter((lead) => lead.stage === "WON");
  const closedLeads = leads.filter((lead) => lead.stage === "WON" || lead.stage === "LOST");
  const leadConversion = closedLeads.length ? (wonLeads.length / closedLeads.length) * 100 : 0;
  const openLeadValue = leads
    .filter((lead) => lead.stage === "NEW" || lead.stage === "QUOTED")
    .reduce((sum, lead) => sum + Number(lead.value), 0);

  const acceptedQuotes = quotes.filter((quote) => quote.status === "ACCEPTED");
  const decidedQuotes = quotes.filter((quote) => quote.status === "ACCEPTED" || quote.status === "DECLINED");
  const quoteAcceptance = decidedQuotes.length ? (acceptedQuotes.length / decidedQuotes.length) * 100 : 0;
  const acceptedQuoteValue = acceptedQuotes.reduce((sum, quote) => sum + Number(quote.amount), 0);

  const completedJobs = jobs.filter((job) => job.status === "COMPLETE" || job.status === "INVOICED").length;
  const jobCompletion = jobs.length ? (completedJobs / jobs.length) * 100 : 0;

  const paidRevenue = invoices
    .filter((invoice) => invoice.clientId && invoice.status === "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const now = new Date();
  const overdueReceivables = invoices
    .filter((invoice) => invoice.clientId && invoice.status !== "PAID" && (invoice.status === "OVERDUE" || invoice.dueDate < now))
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const outstandingPayables = invoices
    .filter((invoice) => invoice.supplier && invoice.status !== "PAID")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const approvedHours = timesheets
    .filter((entry) => entry.status === "APPROVED")
    .reduce((sum, entry) => sum + Number(entry.hours), 0);
  const pendingHours = timesheets
    .filter((entry) => entry.status === "PENDING")
    .reduce((sum, entry) => sum + Number(entry.hours), 0);

  return (
    <AnalyticsView
      metrics={{
        leadConversion,
        openLeadValue,
        quoteAcceptance,
        acceptedQuoteValue,
        jobCompletion,
        completedJobs,
        totalJobs: jobs.length,
        paidRevenue,
        overdueReceivables,
        outstandingPayables,
        averageRating,
        reviewCount: reviews.length,
        approvedHours,
        pendingHours,
      }}
    />
  );
}
