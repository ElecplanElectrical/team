import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import EquipmentView from "@/components/EquipmentView";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [equipment, jobs, users] = await Promise.all([
    prisma.equipment.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }] }),
    prisma.job.findMany({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      orderBy: { scheduledStart: "asc" },
      select: { id: true, title: true, address: true, client: { select: { name: true } } },
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <EquipmentView
      equipment={equipment.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category ?? "Equipment",
        quantity: e.quantity,
        assetNumber: e.assetNumber,
        serialNumber: e.serialNumber,
        condition: "GOOD",
        status: e.status,
        location: e.location ?? "Workshop",
        assignedUserId: e.assignedTo,
        assignedJobId: null,
        notes: e.notes,
        lastStocktakeAt: null,
        hasPhoto: Boolean(e.photoStorageKey || e.photoUrl),
        movements: [],
      }))}
      jobs={jobs.map((j) => ({ id: j.id, title: j.title, address: j.address, client: j.client.name }))}
      users={users}
      role={user.role}
    />
  );
}
