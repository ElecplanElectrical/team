import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EVENT_TYPES } from "@/lib/theme";
import { recordAudit } from "@/lib/audit";

const eventSchema = z
  .object({
    title: z.string().trim().max(120).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    type: z.enum(EVENT_TYPES),
    jobId: z.string().cuid().optional().nullable(),
    assignedToId: z.string().cuid().optional().nullable(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (user.role === "EMPLOYEE" && (data.type === "job" || data.jobId)) {
    return NextResponse.json(
      { error: "Job scheduling must be done by an admin or supervisor" },
      { status: 403 },
    );
  }

  const assignedToId = user.role === "EMPLOYEE" ? user.id : data.assignedToId ?? null;
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);

  try {
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.jobEvent.create({
        data: {
          title: data.title?.trim() || null,
          notes: data.notes?.trim() || null,
          type: data.type,
          jobId: data.jobId ?? null,
          assignedToId,
          startsAt,
          endsAt,
        },
      });

      if (data.type === "job" && data.jobId) {
        const existing = await tx.job.findUnique({
          where: { id: data.jobId },
          select: { status: true },
        });
        if (!existing) throw new Error("JOB_NOT_FOUND");

        await tx.job.update({
          where: { id: data.jobId },
          data: {
            scheduledStart: startsAt,
            scheduledEnd: endsAt,
            assignedToId,
            ...(existing.status === "QUOTED" ? { status: "SCHEDULED" as const } : {}),
          },
        });
      }

      return created;
    });

    if (data.type === "job" && data.jobId) {
      await recordAudit({
        actor: user,
        action: "CALENDAR_JOB_EVENT_CREATED",
        entityType: "JobEvent",
        entityId: event.id,
        details: { jobId: data.jobId, assignedToId },
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create event (check job/assignee)" },
      { status: 400 },
    );
  }
}
