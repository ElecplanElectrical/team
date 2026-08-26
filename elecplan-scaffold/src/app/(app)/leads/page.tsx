import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import LeadsView from "@/components/LeadsView";

export default async function LeadsPage() {
  const user = await requireAccess("leads");
  const businessId = user.businessId ?? "__unassigned__";
  const [leads, clients] = await Promise.all([
    prisma.lead.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, include: { client: { select: { name: true } } } }),
    prisma.client.findMany({ where: { businessId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return <LeadsView leads={leads.map((lead) => ({ id: lead.id, client: lead.client.name, description: lead.description, value: Number(lead.value), source: lead.source, stage: lead.stage, createdAt: lead.createdAt.toISOString() }))} clients={clients} />;
}
