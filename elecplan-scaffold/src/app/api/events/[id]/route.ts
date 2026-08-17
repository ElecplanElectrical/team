import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EVENT_TYPES } from "@/lib/theme";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  type: z.enum(EVENT_TYPES).optional(),
  jobId: z.string().cuid().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

async function syncCanonicalJobEvent(tx: Prisma.TransactionClient, jobId: string) {
  const canonical = await tx.jobEvent.findFirst({
    where: { jobId, type: "job" },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: { startsAt: true, endsAt: true, assignedToId: true },
  });

  if (canonical) {
    await tx.job.update({
      where: { id: jobId },
      data: {
        scheduledStart: canonical.startsAt,
        scheduledEnd: canonical.endsAt,
        assignedToId: canonical.assignedToId,
      },
    });
  } else {
    await tx.job.update({
      where: { id: jobId },
      data: { scheduledStart: null, scheduledEnd: null },
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.jobEvent.findUnique({
    where: { id },
    select: {
      id: true,
      jobId: true,
      type: true,
      assignedToId: true,
      startsAt: true,
      endsAt: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (user.role === "EMPLOYEE" && existing.assignedToId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  // Job-linked calendar events are a scheduling control surface for the Job itself.
  // Crew can view these events, but only admins/supervisors may reschedule, relink,
  // reassign or delete them. This prevents an employee calendar edit from silently
  // changing the underlying job schedule.
  if (user.role === "EMPLOYEE") {
    if (existing.type === "job" || existing.jobId) {
      return NextResponse.json(
        { error: "Job schedule changes must be made by an admin or supervisor" },
        { status: 403 },
      );
    }
    if (d.type !== undefined || d.jobId !== undefined || d.assignedToId !== undefined) {
      return NextResponse.json(
        { error: "Employees can only edit the title and time of their own non-job events" },
        { status: 403 },
      );
    }
  }

  const nextStart = d.startsAt ? new Date(d.startsAt) : existing.startsAt;
  const nextEnd = d.endsAt ? new Date(d.endsAt) : existing.endsAt;
  if (nextEnd <= nextStart) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  try {
    const event = await prisma.$transaction(async (tx) => {
      const updated = await tx.jobEvent.update({
        where: { id },
        data: {
          ...(d.title !== undefined ? { title: d.title?.trim() || null } : {}),
          ...(d.type ? { type: d.type } : {}),
          ...(d.jobId !== undefined ? { jobId: d.jobId } : {}),
          ...(d.assignedToId !== undefined ? { assignedToId: d.assignedToId } : {}),
          ...(d.startsAt ? { startsAt: new Date(d.startsAt) } : {}),
          ...(d.endsAt ? { endsAt: new Date(d.endsAt) } : {}),
        },
        select: {
          id: true,
          title: true,
          jobId: true,
          type: true,
          assignedToId: true,
          startsAt: true,
          endsAt: true,
        },
      });

      const affectedJobIds = new Set<string>();
      if (existing.type === "job" && existing.jobId) affectedJobIds.add(existing.jobId);
      if (updated.type === "job" && updated.jobId) affectedJobIds.add(updated.jobId);

      for (const jobId of affectedJobIds) {
        await syncCanonicalJobEvent(tx, jobId);
      }

      return updated;
    });

    if (existing.type === "job" || event.type === "job" || existing.jobId || event.jobId) {
      await recordAudit({
        actor: user,
        action: "CALENDAR_JOB_EVENT_UPDATED",
        entityType: "JobEvent",
        entityId: event.id,
        details: {
          previousJobId: existing.jobId,
          jobId: event.jobId,
          startsAtChanged: existing.startsAt.getTime() !== event.startsAt.getTime(),
          endsAtChanged: existing.endsAt.getTime() !== event.endsAt.getTime(),
          assignedToChanged: existing.assignedToId !== event.assignedToId,
        },
      });
    }

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.jobEvent.findUnique({
    where: { id },
    select: { id: true, jobId: true, type: true, assignedToId: true },
  });
  if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (user.role === "EMPLOYEE" && existing.assignedToId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "EMPLOYEE" && (existing.type === "job" || existing.jobId)) {
    return NextResponse.json(
      { error: "Job schedule changes must be made by an admin or supervisor" },
      { status: 403 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.jobEvent.delete({ where: { id } });
      if (existing.type === "job" && existing.jobId) {
        await syncCanonicalJobEvent(tx, existing.jobId);
      }
    });

    if (existing.type === "job" || existing.jobId) {
      await recordAudit({
        actor: user,
        action: "CALENDAR_JOB_EVENT_DELETED",
        entityType: "JobEvent",
        entityId: existing.id,
        details: { jobId: existing.jobId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
