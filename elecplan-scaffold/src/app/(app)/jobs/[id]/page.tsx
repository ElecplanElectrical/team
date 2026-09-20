import { notFound, redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import JobDetailView from "@/components/JobDetailView";
import JobTasksPanel from "@/components/JobTasksPanel";
import JobOperationsPanel from "@/components/JobOperationsPanel";

export const dynamic = "force-dynamic";

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, contactName: true, phone: true, email: true, address: true } },
      assignedTo: { select: { id: true, name: true } },
      photos: { orderBy: { createdAt: "desc" }, select: { id: true, url: true, createdAt: true } },
    },
  });
  if (!job) notFound();
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id) notFound();

  const activity = await prisma.jobEvent.findMany({
    where: { jobId: id, type: { in: ["field-arrived", "field-complete", "field-revisit"] } },
    orderBy: { startsAt: "asc" },
    select: { type: true, startsAt: true },
  });
  let totalMinutes = 0;
  for (let i = 0; i < activity.length; i++) {
    const arrival = activity[i];
    if (arrival.type !== "field-arrived") continue;
    const stop = activity.slice(i + 1).find((e) => (e.type === "field-complete" || e.type === "field-revisit") && e.startsAt >= arrival.startsAt);
    if (stop) totalMinutes += Math.max(0, Math.round((stop.startsAt.getTime() - arrival.startsAt.getTime()) / 60000));
  }

  const [crew, clients] = user.role === "EMPLOYEE"
    ? [[], []]
    : await Promise.all([
        prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#0d1117" }}>
      <JobDetailView
        canEdit={user.role !== "EMPLOYEE"}
        canDelete={user.role === "ADMIN"}
        canArchive={user.role !== "EMPLOYEE"}
        crew={crew}
        clients={clients}
        job={{
          id: job.id,
          title: job.title,
          address: job.address,
          notes: job.notes,
          status: job.status,
          scheduledStart: job.scheduledStart?.toISOString() ?? null,
          scheduledEnd: job.scheduledEnd?.toISOString() ?? null,
          client: job.client,
          assignedTo: job.assignedTo,
          photos: job.photos.map((p) => ({ id: p.id, fileUrl: p.url, originalName: null, uploadedAt: p.createdAt.toISOString() })),
        }}
      />
      <div className="relative z-10 mx-auto -mt-24 max-w-2xl px-3 pb-3 md:px-5">
        {totalMinutes > 0 && <div className="mb-3 flex items-center gap-3 rounded-2xl p-4" style={{ ...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-tray)", border: "1px solid rgba(197,205,215,.24)" }}><Clock3 size={20} style={{ color: "#43D2FF" }} /><div><p className="text-[11px] font-semibold uppercase tracking-[.12em]" style={{ color: "#43D2FF" }}>Time on job</p><p className="mt-1 text-xl font-bold" style={{ color: "#f4f7fa" }}>{formatDuration(totalMinutes)}</p></div></div>}
        <JobTasksPanel jobId={job.id} canManage={user.role !== "EMPLOYEE"} />
        <JobOperationsPanel jobId={job.id} canManage={user.role !== "EMPLOYEE"} />
      </div>
    </div>
  );
}
