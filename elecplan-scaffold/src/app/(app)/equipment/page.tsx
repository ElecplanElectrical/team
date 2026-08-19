import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import EquipmentView from "@/components/EquipmentView";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [equipment, jobs, users] = await Promise.all([
    prisma.equipment.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }], include: { movements: { orderBy: { createdAt: "desc" }, take: 5 } } }),
    prisma.job.findMany({ where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } }, orderBy: { scheduledStart: "asc" }, select: { id: true, title: true, address: true, client: { select: { name: true } } } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return <EquipmentView equipment={equipment.map(e => ({ ...e, purchaseDate: e.purchaseDate?.toISOString() ?? null, lastStocktakeAt: e.lastStocktakeAt?.toISOString() ?? null, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(), movements: e.movements.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })) }))} jobs={jobs.map(j => ({ id:j.id, title:j.title, address:j.address, client:j.client.name }))} users={users} role={user.role} />;
}
