import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import JobTimeline, { type TimelineJob } from "@/components/JobTimeline";
import { COLORS } from "@/lib/theme";
import type { Prisma } from "@prisma/client";

/** Short human-friendly reference derived from the cuid (mockup shows "JB-2211"). */
function jobRef(id: string): string {
  return "JB-" + id.slice(-4).toUpperCase();
}

export default async function JobsPage() {
  const user = await requireAccess("timelines");

  // Crew members only see the jobs assigned to them.
  const where: Prisma.JobWhereInput =
    user.role === "EMPLOYEE" ? { assignedToId: user.id } : {};

  const rows = await prisma.job.findMany({
    where,
    include: {
      client: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const jobs: TimelineJob[] = rows.map((j) => ({
    id: j.id,
    ref: jobRef(j.id),
    title: j.title,
    client: j.client.name,
    address: j.address,
    crew: j.assignedTo?.name ?? null,
    status: j.status,
  }));

  const active = jobs.filter(
    (j) => j.status !== "COMPLETE" && j.status !== "INVOICED",
  ).length;
  const subtitle =
    jobs.length === 0
      ? "No jobs yet"
      : `${active} active job${active === 1 ? "" : "s"} across the pipeline`;

  return (
    <>
      <TopBar title="Job timelines" subtitle={subtitle} />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-5">
        {jobs.map((job) => (
          <JobTimeline key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <div
            className="rounded-lg p-8 text-center text-sm"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}
          >
            No jobs to show yet.
          </div>
        )}
      </div>
    </>
  );
}
