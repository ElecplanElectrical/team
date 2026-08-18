import { addDays, addHours, startOfDay } from "date-fns";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartFrom, weekKey } from "@/lib/week";
import CalendarView from "@/components/CalendarView";
import type { Prisma } from "@prisma/client";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await requireAccess("calendar");
  const { week } = await searchParams;
  const start = weekStartFrom(week);
  const end = addDays(start, 7);
  const queryStart = addDays(start, -1);
  const queryEnd = addDays(end, 1);

  const where: Prisma.JobEventWhereInput = { startsAt: { gte: queryStart, lt: queryEnd } };
  if (user.role === "EMPLOYEE") where.assignedToId = user.id;
  const scheduledJobWhere: Prisma.JobWhereInput = { scheduledStart: { not: null, gte: queryStart, lt: queryEnd }, scheduledEnd: { not: null }, ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}) };

  const [rows, scheduledJobs, jobs, employees, inspections] = await Promise.all([
    prisma.jobEvent.findMany({ where, include: { job: { select: { title: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.job.findMany({ where: scheduledJobWhere, select: { id: true, title: true, assignedToId: true, scheduledStart: true, scheduledEnd: true }, orderBy: { scheduledStart: "asc" } }),
    prisma.job.findMany({ where: user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}, select: { id: true, title: true, client: { select: { name: true } } }, orderBy: { title: "asc" } }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.inspection.findMany({
      where: { date: { gte: queryStart, lt: queryEnd }, status: "SCHEDULED", ...(user.role === "EMPLOYEE" ? { job: { assignedToId: user.id } } : {}) },
      select: { id: true, type: true, date: true, jobId: true, job: { select: { title: true, assignedToId: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const linkedJobIds = new Set(rows.flatMap((event) => event.jobId ? [event.jobId] : []));
  const events = [
    ...rows.map((ev) => ({ id: ev.id, title: ev.title || ev.job?.title || "(untitled)", customTitle: ev.title, type: ev.type, jobId: ev.jobId, assignedToId: ev.assignedToId, startsAt: ev.startsAt.toISOString(), endsAt: ev.endsAt.toISOString(), fallback: false })),
    ...scheduledJobs.filter((job) => !linkedJobIds.has(job.id) && job.scheduledStart && job.scheduledEnd).map((job) => ({ id: `job-fallback:${job.id}`, title: job.title, customTitle: null, type: "job", jobId: job.id, assignedToId: job.assignedToId, startsAt: job.scheduledStart!.toISOString(), endsAt: job.scheduledEnd!.toISOString(), fallback: true })),
    // Inspections currently store a date rather than a time. Place scheduled
    // inspections at 8am for one hour so they are clearly visible in the week.
    ...inspections.map((inspection) => {
      const startsAt = addHours(startOfDay(inspection.date), 8);
      return { id: `inspection:${inspection.id}`, title: `Inspection: ${inspection.type} — ${inspection.job.title}`, customTitle: null, type: "inspection", jobId: null, assignedToId: inspection.job.assignedToId, startsAt: startsAt.toISOString(), endsAt: addHours(startsAt, 1).toISOString(), fallback: false };
    }),
  ];

  return <CalendarView weekStart={weekKey(start)} events={events} jobs={jobs.map((job) => ({ id: job.id, title: job.title, client: job.client.name }))} employees={employees} role={user.role} currentUserId={user.id} />;
}
