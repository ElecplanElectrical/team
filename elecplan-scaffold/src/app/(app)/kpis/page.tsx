import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import KpisView from "@/components/KpisView";

export default async function KpisPage() {
  await requireAccess("kpis");
  const [employees, kpis] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.employeeKpi.findMany({
      orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <KpisView
      employees={employees}
      initialKpis={kpis.map((k) => ({
        id: k.id,
        userId: k.userId,
        weekStart: k.weekStart.toISOString().slice(0, 10),
        jobsComplete: k.jobsComplete,
        hoursWorked: Number(k.hoursWorked),
        reworkCount: k.reworkCount,
        notes: k.notes,
      }))}
    />
  );
}
