import { addDays } from "date-fns";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartFrom, weekKey } from "@/lib/week";
import CalendarView from "@/components/CalendarView";
import CalendarQuickJobBridge from "@/components/CalendarQuickJobBridge";
import type { Prisma } from "@prisma/client";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await requireAccess("calendar");
  const businessId = user.businessId ?? "__unassigned__";
  const isQls = user.business?.slug === "qls";
  const { week } = await searchParams;
  const start = weekStartFrom(week);
  const end = addDays(start, 7);
  const queryStart = addDays(start, -1);
  const queryEnd = addDays(end, 1);

  const where: Prisma.JobEventWhereInput = {
    OR: [{ job: { businessId } }, { jobId: null, assignedTo: { businessId } }],
    startsAt: { gte: queryStart, lt: queryEnd },
    type: { notIn: ["field-arrived", "field-complete", "field-revisit"] },
  };
  if (user.role === "EMPLOYEE") where.assignedToId = user.id;
  const scheduledJobWhere: Prisma.JobWhereInput = { businessId, scheduledStart: { not: null, gte: queryStart, lt: queryEnd }, scheduledEnd: { not: null }, ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}) };

  const [rows, scheduledJobs, jobs, employees, inspections, clients] = await Promise.all([
    prisma.jobEvent.findMany({ where, include: { job: { select: { title: true } } }, orderBy: { startsAt: "asc" } }),
    prisma.job.findMany({ where: scheduledJobWhere, select: { id: true, title: true, assignedToId: true, scheduledStart: true, scheduledEnd: true }, orderBy: { scheduledStart: "asc" } }),
    prisma.job.findMany({
      where: { businessId, ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}) },
      select: { id: true, title: true, address: true, notes: true, status: true, scheduledStart: true, scheduledEnd: true, assignedTo: { select: { name: true } }, client: { select: { name: true, contactName: true, phone: true } } },
      orderBy: { title: "asc" },
    }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.user.findMany({ where: { businessId, active: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    isQls ? Promise.resolve([]) : prisma.inspection.findMany({ where: { date: { gte: queryStart, lt: queryEnd }, status: "SCHEDULED", job: { businessId, ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}) } }, select: { id: true, type: true, date: true, jobId: true, job: { select: { title: true, assignedToId: true } } }, orderBy: { date: "asc" } }),
    user.role === "EMPLOYEE" ? Promise.resolve([]) : prisma.client.findMany({ where: { businessId }, select: { id: true, name: true, address: true }, orderBy: { name: "asc" } }),
  ]);

  const linkedJobIds = new Set(rows.flatMap((event) => event.jobId ? [event.jobId] : []));
  const events = [
    ...rows.map((ev) => ({ id: ev.id, title: ev.title || ev.job?.title || "(untitled)", customTitle: ev.title, notes: ev.notes, type: ev.type, jobId: ev.jobId, assignedToId: ev.assignedToId, startsAt: ev.startsAt.toISOString(), endsAt: ev.endsAt.toISOString(), fallback: false })),
    ...scheduledJobs.filter((job) => !linkedJobIds.has(job.id) && job.scheduledStart && job.scheduledEnd).map((job) => ({ id: `job-fallback:${job.id}`, title: job.title, customTitle: null, notes: null, type: "job", jobId: job.id, assignedToId: job.assignedToId, startsAt: job.scheduledStart!.toISOString(), endsAt: job.scheduledEnd!.toISOString(), fallback: true })),
    ...inspections.map((inspection) => ({ id: `inspection:${inspection.id}`, title: `Inspection: ${inspection.type} — ${inspection.job.title}`, customTitle: null, notes: null, type: "inspection", jobId: null, assignedToId: inspection.job.assignedToId, startsAt: new Date(new Date(inspection.date).setHours(8, 0, 0, 0)).toISOString(), endsAt: new Date(new Date(inspection.date).setHours(9, 0, 0, 0)).toISOString(), fallback: false })),
  ];

  return <>
    <CalendarView weekStart={weekKey(start)} events={events} jobs={jobs.map((job) => ({ id: job.id, title: job.title, client: job.client.name, contactName: job.client.contactName, phone: job.client.phone, address: job.address, notes: job.notes, status: job.status, crew: job.assignedTo?.name ?? null, scheduledStart: job.scheduledStart?.toISOString() ?? null, scheduledEnd: job.scheduledEnd?.toISOString() ?? null }))} employees={employees.map(({ id, name }) => ({ id, name }))} role={user.role} currentUserId={user.id} />
    {isQls && user.role !== "EMPLOYEE" && <CalendarQuickJobBridge weekStart={weekKey(start)} clients={clients} crew={employees.map((person) => ({ id: person.id, name: person.name, role: person.role }))} role={user.role} />}
  </>;
}
