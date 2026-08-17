import { addDays } from "date-fns";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartFrom, weekKey } from "@/lib/week";
import CalendarView from "@/components/CalendarView";
import type { Prisma } from "@prisma/client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireAccess("calendar");
  const { week } = await searchParams;
  const start = weekStartFrom(week);
  const end = addDays(start, 7);

  const where: Prisma.JobEventWhereInput = {
    startsAt: { gte: start, lt: end },
  };
  if (user.role === "EMPLOYEE") where.assignedToId = user.id;

  const [rows, jobs, employees] = await Promise.all([
    prisma.jobEvent.findMany({
      where,
      include: { job: { select: { title: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.job.findMany({
      where: user.role === "EMPLOYEE" ? { assignedToId: user.id } : {},
      select: { id: true, title: true, client: { select: { name: true } } },
      orderBy: { title: "asc" },
    }),
    user.role === "EMPLOYEE"
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  const events = rows.map((ev) => ({
    id: ev.id,
    title: ev.title || ev.job?.title || "(untitled)",
    customTitle: ev.title,
    type: ev.type,
    jobId: ev.jobId,
    assignedToId: ev.assignedToId,
    startsAt: ev.startsAt.toISOString(),
    endsAt: ev.endsAt.toISOString(),
  }));

  return (
    <CalendarView
      weekStart={weekKey(start)}
      events={events}
      jobs={jobs.map((job) => ({ id: job.id, title: job.title, client: job.client.name }))}
      employees={employees}
      role={user.role}
      currentUserId={user.id}
    />
  );
}
