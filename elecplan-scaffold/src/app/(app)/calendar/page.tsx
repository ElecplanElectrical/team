import { addDays, addHours, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartFrom, weekKey } from "@/lib/week";
import CalendarView from "@/components/CalendarView";
import QLSMobileCalendar from "@/components/QLSMobileCalendar";
import CalendarDoubleClickBridge from "@/components/CalendarDoubleClickBridge";
import type { Prisma } from "@prisma/client";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await requireAccess("calendar");
  const { week } = await searchParams;
  const start = weekStartFrom(week);
  const end = addDays(start, 7);
  const queryStart = addDays(start, -1);
  const queryEnd = addDays(end, 1);
  const monthQueryStart = addDays(startOfMonth(new Date()), -7);
  const monthQueryEnd = addDays(endOfMonth(new Date()), 7);

  const where: Prisma.JobEventWhereInput = {
    startsAt: { gte: queryStart, lt: queryEnd },
    type: { notIn: ["field-arrived", "field-complete", "field-revisit"] },
  };
  if (user.role === "EMPLOYEE") where.assignedToId = user.id;
  const scheduledJobWhere: Prisma.JobWhereInput = {
    scheduledStart: { not: null, gte: queryStart, lt: queryEnd },
    scheduledEnd: { not: null },
    ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
  };
  const mobileEventWhere: Prisma.JobEventWhereInput = {
    startsAt: { gte: monthQueryStart, lt: monthQueryEnd },
    type: { notIn: ["field-arrived", "field-complete", "field-revisit"] },
    ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
  };
  const mobileJobWhere: Prisma.JobWhereInput = {
    scheduledStart: { not: null, lt: monthQueryEnd },
    scheduledEnd: { not: null, gte: monthQueryStart },
    ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
  };

  const [rows, scheduledJobs, jobs, employees, inspections, mobileRows, mobileJobs] = await Promise.all([
    prisma.jobEvent.findMany({ where, include: { job: { select: { title: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.job.findMany({ where: scheduledJobWhere, select: { id: true, title: true, assignedToId: true, scheduledStart: true, scheduledEnd: true }, orderBy: { scheduledStart: "asc" } }),
    prisma.job.findMany({
      where: user.role === "EMPLOYEE" ? { assignedToId: user.id } : {},
      select: {
        id: true,
        title: true,
        address: true,
        notes: true,
        status: true,
        assignedToId: true,
        scheduledStart: true,
        scheduledEnd: true,
        assignedTo: { select: { name: true } },
        client: { select: { name: true, contactName: true, phone: true } },
      },
      orderBy: { title: "asc" },
    }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.inspection.findMany({
      where: { date: { gte: queryStart, lt: queryEnd }, status: "SCHEDULED", ...(user.role === "EMPLOYEE" ? { job: { assignedToId: user.id } } : {}) },
      select: { id: true, type: true, date: true, jobId: true, job: { select: { title: true, assignedToId: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.jobEvent.findMany({ where: mobileEventWhere, include: { job: { select: { title: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.job.findMany({
      where: mobileJobWhere,
      select: {
        id: true,
        title: true,
        address: true,
        status: true,
        assignedToId: true,
        scheduledStart: true,
        scheduledEnd: true,
        assignedTo: { select: { name: true } },
        client: { select: { name: true } },
      },
      orderBy: { scheduledStart: "asc" },
    }),
  ]);

  const linkedJobIds = new Set(rows.flatMap((event) => event.jobId ? [event.jobId] : []));
  const events = [
    ...rows.map((ev) => ({ id: ev.id, title: ev.title || ev.job?.title || "(untitled)", customTitle: ev.title, notes: ev.notes, type: ev.type, jobId: ev.jobId, assignedToId: ev.assignedToId, startsAt: ev.startsAt.toISOString(), endsAt: ev.endsAt.toISOString(), fallback: false })),
    ...scheduledJobs.filter((job) => !linkedJobIds.has(job.id) && job.scheduledStart && job.scheduledEnd).map((job) => ({ id: `job-fallback:${job.id}`, title: job.title, customTitle: null, notes: null, type: "job", jobId: job.id, assignedToId: job.assignedToId, startsAt: job.scheduledStart!.toISOString(), endsAt: job.scheduledEnd!.toISOString(), fallback: true })),
    ...inspections.map((inspection) => {
      const startsAt = addHours(startOfDay(inspection.date), 8);
      return { id: `inspection:${inspection.id}`, title: `Inspection: ${inspection.type} — ${inspection.job.title}`, customTitle: null, notes: null, type: "inspection", jobId: null, assignedToId: inspection.job.assignedToId, startsAt: startsAt.toISOString(), endsAt: addHours(startsAt, 1).toISOString(), fallback: false };
    }),
  ];

  const mobileEvents = mobileRows
    .filter((event) => !event.jobId)
    .map((event) => ({
      id: event.id,
      title: event.title || event.job?.title || "(untitled)",
      customTitle: event.title,
      notes: event.notes,
      type: event.type,
      jobId: event.jobId,
      assignedToId: event.assignedToId,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      fallback: false,
    }));

  const mappedJobs = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    client: job.client.name,
    contactName: job.client.contactName,
    phone: job.client.phone,
    address: job.address,
    notes: job.notes,
    status: job.status,
    assignedToId: job.assignedToId,
    crew: job.assignedTo?.name ?? null,
    scheduledStart: job.scheduledStart?.toISOString() ?? null,
    scheduledEnd: job.scheduledEnd?.toISOString() ?? null,
  }));

  const mappedMobileJobs = mobileJobs.map((job) => ({
    id: job.id,
    title: job.title,
    client: job.client.name,
    address: job.address,
    status: job.status,
    assignedToId: job.assignedToId,
    crew: job.assignedTo?.name ?? null,
    scheduledStart: job.scheduledStart?.toISOString() ?? null,
    scheduledEnd: job.scheduledEnd?.toISOString() ?? null,
  }));

  const currentWeekKey = weekKey(start);
  return <>
    <div className="md:hidden">
      <QLSMobileCalendar events={mobileEvents} jobs={mappedMobileJobs} employees={employees} role={user.role} currentUserId={user.id} />
    </div>
    <div className="hidden md:contents">
      <CalendarDoubleClickBridge weekStart={currentWeekKey} />
      <CalendarView
        weekStart={currentWeekKey}
        events={events}
        jobs={mappedJobs}
        employees={employees}
        role={user.role}
        currentUserId={user.id}
      />
    </div>
  </>;
}
