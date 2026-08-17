import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const updateSchema = z.object({
  status: z.enum(["QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETE", "INVOICED"]).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  address: z.string().trim().min(1).max(240).optional(),
  assignedToId: z.string().trim().optional().nullable(),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can update jobs" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid job update" }, { status: 400 });
  }
  if (parsed.data.status === "INVOICED" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can mark jobs as invoiced" }, { status: 403 });
  }

  const d = parsed.data;
  const hasStart = Object.prototype.hasOwnProperty.call(d, "scheduledStart");
  const hasEnd = Object.prototype.hasOwnProperty.call(d, "scheduledEnd");
  const scheduleChanged = hasStart || hasEnd;
  if (hasStart !== hasEnd) {
    return NextResponse.json({ error: "Scheduled start and end must be updated together" }, { status: 400 });
  }

  const start = d.scheduledStart ? new Date(d.scheduledStart) : null;
  const end = d.scheduledEnd ? new Date(d.scheduledEnd) : null;
  if (scheduleChanged && Boolean(start) !== Boolean(end)) {
    return NextResponse.json({ error: "Scheduled start and end must both be set or both be cleared" }, { status: 400 });
  }
  if (start && end && end <= start) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const { id } = await context.params;
  const current = await prisma.job.findUnique({ where: { id }, select: { id: true } });
  if (!current) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (d.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: d.assignedToId, active: true },
      select: { id: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 });
    }
  }

  try {
    const job = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data: {
          ...(d.status !== undefined ? { status: d.status } : {}),
          ...(d.title !== undefined ? { title: d.title } : {}),
          ...(d.address !== undefined ? { address: d.address } : {}),
          ...(d.assignedToId !== undefined ? { assignedToId: d.assignedToId || null } : {}),
          ...(scheduleChanged ? { scheduledStart: start, scheduledEnd: end } : {}),
          ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
        },
        select: {
          id: true,
          title: true,
          address: true,
          status: true,
          assignedToId: true,
          scheduledStart: true,
          scheduledEnd: true,
          notes: true,
        },
      });

      if (scheduleChanged || d.assignedToId !== undefined) {
        const event = await tx.jobEvent.findFirst({
          where: { jobId: id, type: "job" },
          orderBy: { startsAt: "asc" },
          select: { id: true },
        });

        if (updated.scheduledStart && updated.scheduledEnd) {
          if (event) {
            await tx.jobEvent.update({
              where: { id: event.id },
              data: {
                startsAt: updated.scheduledStart,
                endsAt: updated.scheduledEnd,
                assignedToId: updated.assignedToId,
              },
            });
          } else {
            await tx.jobEvent.create({
              data: {
                jobId: id,
                type: "job",
                startsAt: updated.scheduledStart,
                endsAt: updated.scheduledEnd,
                assignedToId: updated.assignedToId,
              },
            });
          }
        } else if (event && scheduleChanged) {
          await tx.jobEvent.delete({ where: { id: event.id } });
        } else if (event && d.assignedToId !== undefined) {
          await tx.jobEvent.update({
            where: { id: event.id },
            data: { assignedToId: updated.assignedToId },
          });
        }
      }

      return updated;
    });

    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Could not update job" }, { status: 400 });
  }
}
