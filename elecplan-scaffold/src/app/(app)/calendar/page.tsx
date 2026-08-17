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

  // Railway runs in UTC while Elecplan schedules in Melbourne time. Query a
  // one-day safety margin either side, then let CalendarView place events by
  // the browser's local calendar day. This prevents early-Monday Melbourne
  // bookings from being filtered out by a UTC week boundary.
  const queryStart = addDays(start, -1);
  const queryEnd = addDays(end, 1);

  const where: Prisma.JobEventWhereInput = {
    startsAt: { gte: queryStart, lt: queryEnd },
  };
  if (user.role === "EMPLOYEE") where.assignedToId = user.id;

  const scheduledJobWhere: Prisma.JobWhereInput = {
    scheduledStart: { not: null, gte: queryStart, lt: queryEnd },
    scheduledEnd: { not: null },
    ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
  };

  const [rows, scheduledJobs, jobs, employees] = await Promise.all([
    prisma.jobEvent.findMany({
      where,
      include: { job: { select: { title: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.job.findMany({
      where: scheduledJobWhere,
      select: {
        id: true,
        title: true,
        assignedToId: true,
        scheduledStart: true,
        scheduledEnd: true,
      },
      orderBy: { scheduledStart: "asc" },
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

  const linkedJobIds = new Set(rows.flatMap((event) => event.jobId ? [event.jobId] : []));

  const events = [
    ...rows.map((ev) => ({
      id: ev.id,
      title: ev.title || ev.job?.title || "(untitled)",
      customTitle: ev.title,
      type: ev.type,
      jobId: ev.jobId,
      assignedToId: ev.assignedToId,
      startsAt: ev.startsAt.toISOString(),
      endsAt: ev.endsAt.toISOString(),
      fallback: false,
    })),
    // Older or partially-created scheduled jobs may not have a JobEvent row.
    // Show them directly from the Job schedule so a booking can never vanish.
    ...scheduledJobs
      .filter((job) => !linkedJobIds.has(job.id) && job.scheduledStart && job.scheduledEnd)
      .map((job) => ({
        id: `job-fallback:${job.id}`,
        title: job.title,
        customTitle: null,
        type: "job",
        jobId: job.id,
        assignedToId: job.assignedToId,
        startsAt: job.scheduledStart!.toISOString(),
        endsAt: job.scheduledEnd!.toISOString(),
        fallback: true,
      })),
  ];

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
