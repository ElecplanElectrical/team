import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import JobsView from "@/components/JobsView";
import type { TimelineJob } from "@/components/JobTimeline";
import type { Prisma } from "@prisma/client";

function jobRef(id: string): string { return "JB-" + id.slice(-4).toUpperCase(); }

export default async function JobsPage() {
  const user = await requireAccess("timelines");
  const where: Prisma.JobWhereInput = {
    ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
    NOT: { notes: { contains: "[ARCHIVED]" } },
  };
  const [rows, clients, crew] = await Promise.all([
    prisma.job.findMany({ where, include: { client: { select: { name: true } }, assignedTo: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.client.findMany({ select: { id: true, name: true, address: true }, orderBy: { name: "asc" } }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
  ]);
  const jobs: TimelineJob[] = rows.map((j) => ({ id:j.id,ref:jobRef(j.id),title:j.title,client:j.client.name,address:j.address,crew:j.assignedTo?.name??null,assignedToId:j.assignedToId,status:j.status,scheduledStart:j.scheduledStart?.toISOString()??null,scheduledEnd:j.scheduledEnd?.toISOString()??null,notes:j.notes }));
  return <JobsView jobs={jobs} clients={clients} crew={crew} canCreate={user.role!=="EMPLOYEE"}/>;
}
