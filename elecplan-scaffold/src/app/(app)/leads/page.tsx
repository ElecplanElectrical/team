import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import LeadsView from "@/components/LeadsView";

export default async function LeadsPage() {
  await requireAccess("leads");
  const [leads, clients] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, include: { client: { select: { name: true } } } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <LeadsView leads={leads.map((lead) => ({ id: lead.id, client: lead.client.name, description: lead.description, value: Number(lead.value), source: lead.source, stage: lead.stage, createdAt: lead.createdAt.toISOString() }))} clients={clients} />;
}
