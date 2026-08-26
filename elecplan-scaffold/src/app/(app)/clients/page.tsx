import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientsView, { type ClientRow } from "@/components/ClientsView";

export default async function ClientsPage() {
  const user = await requireAccess("clients");
  const businessId = user.businessId ?? "__unassigned__";

  const [clients, billedByClient, lastJobByClient, jobs, crew, inspections] = await Promise.all([
    prisma.client.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
        billingNotes: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.invoice.groupBy({ where: { businessId }, by: ["clientId"], _sum: { amount: true } }),
    prisma.job.groupBy({ where: { businessId }, by: ["clientId"], _max: { scheduledStart: true, createdAt: true } }),
    prisma.job.findMany({
      where: { businessId },
      select: { id: true, clientId: true, title: true, address: true, status: true, scheduledStart: true, createdAt: true },
      orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { businessId, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.inspection.findMany({
      where: { job: { businessId } },
      select: { id: true, jobId: true, type: true, status: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const billed = new Map(billedByClient.filter((b) => b.clientId != null).map((b) => [b.clientId as string, Number(b._sum.amount ?? 0)]));
  const lastJob = new Map(lastJobByClient.map((j) => [j.clientId, (j._max.scheduledStart ?? j._max.createdAt)?.toISOString() ?? null]));

  const inspectionsByJob = new Map<string, { id: string; type: string; status: string; date: string }[]>();
  for (const inspection of inspections) {
    const current = inspectionsByJob.get(inspection.jobId) ?? [];
    current.push({ id: inspection.id, type: inspection.type, status: inspection.status, date: inspection.date.toISOString() });
    inspectionsByJob.set(inspection.jobId, current);
  }

  const jobsByClient = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const current = jobsByClient.get(job.clientId) ?? [];
    current.push(job);
    jobsByClient.set(job.clientId, current);
  }

  const rows: ClientRow[] = clients.map((c) => {
    const clientJobs = jobsByClient.get(c.id) ?? [];
    const siteMap = new Map<string, { address: string; jobs: ClientRow["sites"][number]["jobs"] }>();
    for (const job of clientJobs) {
      const address = job.address.trim();
      const key = address.toLowerCase().replace(/\s+/g, " ");
      const site = siteMap.get(key) ?? { address, jobs: [] };
      site.jobs.push({
        id: job.id,
        title: job.title,
        status: job.status,
        scheduledStart: job.scheduledStart?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString(),
        inspections: inspectionsByJob.get(job.id) ?? [],
      });
      siteMap.set(key, site);
    }
    if (c.address?.trim()) {
      const address = c.address.trim();
      const key = address.toLowerCase().replace(/\s+/g, " ");
      if (!siteMap.has(key)) siteMap.set(key, { address, jobs: [] });
    }
    const sites = [...siteMap.values()].sort((a, b) => a.address.localeCompare(b.address));
    return {
      id: c.id,
      name: c.name,
      contactName: c.contactName,
      phone: c.phone,
      email: c.email,
      address: c.address,
      billingNotes: c.billingNotes,
      jobs: c._count.jobs,
      billed: billed.get(c.id) ?? 0,
      lastJob: lastJob.get(c.id) ?? null,
      sites,
    };
  });

  const totalBilled = rows.reduce((sum, r) => sum + r.billed, 0);

  return <ClientsView clients={rows} totalBilled={totalBilled} crew={crew} currentUserRole={user.role} />;
}
