import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EVENT_TYPES } from "@/lib/theme";
import { recordAudit } from "@/lib/audit";

const eventSchema = z.object({ title: z.string().trim().max(120).optional().nullable(), notes: z.string().trim().max(2000).optional().nullable(), type: z.enum(EVENT_TYPES), jobId: z.string().cuid().optional().nullable(), assignedToId: z.string().cuid().optional().nullable(), startsAt: z.string().datetime(), endsAt: z.string().datetime() }).refine((d) => new Date(d.endsAt) > new Date(d.startsAt), { message: "End time must be after start time", path: ["endsAt"] });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (user.role === "EMPLOYEE" && (data.type === "job" || data.jobId)) return NextResponse.json({ error: "Job scheduling must be done by an admin or supervisor" }, { status: 403 });

  const assignedToId = user.role === "EMPLOYEE" ? user.id : data.assignedToId ?? null;
  if (assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: assignedToId, businessId, active: true }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: "Assignee not found for this business or inactive" }, { status: 400 });
  }
  if (data.jobId) {
    const job = await prisma.job.findFirst({ where: { id: data.jobId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 404 });
  }

  const startsAt = new Date(data.startsAt), endsAt = new Date(data.endsAt);
  try {
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.jobEvent.create({ data: { title: data.title?.trim() || null, notes: data.notes?.trim() || null, type: data.type, jobId: data.jobId ?? null, assignedToId, startsAt, endsAt } });
      if (data.type === "job" && data.jobId) {
        const existing = await tx.job.findFirst({ where: { id: data.jobId, businessId }, select: { status: true } });
        if (!existing) throw new Error("JOB_NOT_FOUND");
        await tx.job.updateMany({ where: { id: data.jobId, businessId }, data: { scheduledStart: startsAt, scheduledEnd: endsAt, assignedToId, ...(existing.status === "QUOTED" ? { status: "SCHEDULED" as const } : {}) } });
      }
      return created;
    });
    if (data.type === "job" && data.jobId) await recordAudit({ actor: user, action: "CALENDAR_JOB_EVENT_CREATED", entityType: "JobEvent", entityId: event.id, details: { businessId, jobId: data.jobId, assignedToId } });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create event (check job/assignee)" }, { status: 400 });
  }
}
