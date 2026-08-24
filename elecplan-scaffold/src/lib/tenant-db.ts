import { prisma } from "@/lib/prisma";
import { requireBusinessModule } from "@/lib/tenant-access";
import type { YourPlanModule } from "@/lib/brand";

export async function tenantContext(slug: string, module: YourPlanModule) {
  const context = await requireBusinessModule(slug, module);
  return { ...context, businessId: context.business.id };
}

export async function tenantClients(slug: string) {
  const { businessId, business, user, modules } = await tenantContext(slug, "clients");
  const clients = await prisma.client.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return { businessId, business, user, modules, clients };
}

export async function tenantJobs(slug: string) {
  const { businessId, business, user, modules } = await tenantContext(slug, "jobs");
  const jobs = await prisma.job.findMany({
    where: { businessId },
    include: { client: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });
  return { businessId, business, user, modules, jobs };
}

export async function tenantQuotes(slug: string) {
  const { businessId, business, user, modules } = await tenantContext(slug, "quotes");
  const quotes = await prisma.quote.findMany({
    where: { businessId },
    include: { client: true, job: true },
    orderBy: { createdAt: "desc" },
  });
  return { businessId, business, user, modules, quotes };
}

export async function tenantInvoices(slug: string) {
  const { businessId, business, user, modules } = await tenantContext(slug, "invoices");
  const invoices = await prisma.invoice.findMany({
    where: { businessId },
    include: { client: true, job: true },
    orderBy: { createdAt: "desc" },
  });
  return { businessId, business, user, modules, invoices };
}
