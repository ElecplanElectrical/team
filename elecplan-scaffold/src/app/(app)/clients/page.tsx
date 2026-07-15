import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientsView, { type ClientRow } from "@/components/ClientsView";

export default async function ClientsPage() {
  await requireAccess("clients");

  const [clients, billedByClient, lastJobByClient] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
        _count: { select: { jobs: true } },
      },
      orderBy: { name: "asc" },
    }),
    // All-time billed = sum of every invoice raised against the client.
    prisma.invoice.groupBy({
      by: ["clientId"],
      _sum: { amount: true },
    }),
    // Most recent job per client — scheduled date if set, else created date.
    prisma.job.groupBy({
      by: ["clientId"],
      _max: { scheduledStart: true, createdAt: true },
    }),
  ]);

  const billed = new Map(
    billedByClient
      .filter((b) => b.clientId != null)
      .map((b) => [b.clientId as string, Number(b._sum.amount ?? 0)]),
  );
  const lastJob = new Map(
    lastJobByClient.map((j) => [
      j.clientId,
      (j._max.scheduledStart ?? j._max.createdAt)?.toISOString() ?? null,
    ]),
  );

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    contactName: c.contactName,
    jobs: c._count.jobs,
    billed: billed.get(c.id) ?? 0,
    lastJob: lastJob.get(c.id) ?? null,
  }));

  const totalBilled = rows.reduce((sum, r) => sum + r.billed, 0);

  return <ClientsView clients={rows} totalBilled={totalBilled} />;
}
