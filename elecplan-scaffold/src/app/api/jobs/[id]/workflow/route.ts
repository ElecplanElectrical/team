import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ARRIVE") }),
  z.object({ action: z.literal("COMPLETE"), notes: z.string().trim().max(1500).optional().nullable() }),
  z.object({ action: z.literal("REVISIT"), reason: z.string().trim().min(1, "Revisit reason is required").max(1000) }),
]);

async function loadAuthorizedJob(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      address: true,
      notes: true,
      status: true,
      assignedToId: true,
      scheduledStart: true,
      scheduledEnd: true,
      client: { select: { name: true, contactName: true, phone: true } },
    },
  });
  if (!job) return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) } as const;
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id) {
    return { error: NextResponse.json({ error: "This job is not assigned to you" }, { status: 403 }) } as const;
  }
  return { user, job } as const;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await loadAuthorizedJob(id);
  if ("error" in auth) return auth.error;

  const activity = await prisma.jobEvent.findMany({
    where: { jobId: id, type: { in: ["field-arrived", "field-complete", "field-revisit"] } },
    orderBy: { startsAt: "asc" },
    select: { id: true, type: true, title: true, startsAt: true, endsAt: true, assignedToId: true },
  });

  const lastArrival = [...activity].reverse().find((event) => event.type === "field-arrived") ?? null;
  const lastStop = lastArrival
    ? [...activity].reverse().find((event) =>
        (event.type === "field-complete" || event.type === "field-revisit") && event.startsAt >= lastArrival.startsAt,
      ) ?? null
    : null;
  const activeArrival = lastArrival && !lastStop ? lastArrival : null;
  const elapsedSeconds = activeArrival ? Math.max(0, Math.floor((Date.now() - activeArrival.startsAt.getTime()) / 1000)) : 0;

  return NextResponse.json({
    job: {
      ...auth.job,
      scheduledStart: auth.job.scheduledStart?.toISOString() ?? null,
      scheduledEnd: auth.job.scheduledEnd?.toISOString() ?? null,
    },
    activeArrival: activeArrival?.startsAt.toISOString() ?? null,
    elapsedSeconds,
    activity: activity.map((event) => ({ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString() })),
  });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await loadAuthorizedJob(id);
  if ("error" in auth) return auth.error;

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid workflow action" }, { status: 400 });

  const now = new Date();
  const data = parsed.data;

  if (data.action === "ARRIVE") {
    const latestArrival = await prisma.jobEvent.findFirst({ where: { jobId: id, type: "field-arrived" }, orderBy: { startsAt: "desc" } });
    if (latestArrival) {
      const stop = await prisma.jobEvent.findFirst({ where: { jobId: id, type: { in: ["field-complete", "field-revisit"] }, startsAt: { gte: latestArrival.startsAt } }, orderBy: { startsAt: "desc" } });
      if (!stop) return NextResponse.json({ error: "This job is already marked as arrived" }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.jobEvent.create({ data: { jobId: id, type: "field-arrived", title: "Arrived on site", startsAt: now, endsAt: now, assignedToId: auth.user.id } }),
      prisma.job.update({ where: { id }, data: { status: "IN_PROGRESS" } }),
    ]);
    await recordAudit({ actor: auth.user, action: "JOB_ARRIVED", entityType: "Job", entityId: id, details: { title: auth.job.title } });
    return NextResponse.json({ ok: true, arrivedAt: now.toISOString() });
  }

  const latestArrival = await prisma.jobEvent.findFirst({ where: { jobId: id, type: "field-arrived" }, orderBy: { startsAt: "desc" } });
  if (!latestArrival) return NextResponse.json({ error: "Mark Arrived before finishing or requesting a revisit" }, { status: 409 });
  const existingStop = await prisma.jobEvent.findFirst({ where: { jobId: id, type: { in: ["field-complete", "field-revisit"] }, startsAt: { gte: latestArrival.startsAt } } });
  if (existingStop) return NextResponse.json({ error: "This site visit has already been closed" }, { status: 409 });

  const durationMinutes = Math.max(0, Math.round((now.getTime() - latestArrival.startsAt.getTime()) / 60000));

  if (data.action === "COMPLETE") {
    await prisma.$transaction([
      prisma.jobEvent.create({ data: { jobId: id, type: "field-complete", title: data.notes || "Job completed", startsAt: now, endsAt: now, assignedToId: auth.user.id } }),
      prisma.job.update({ where: { id }, data: { status: "COMPLETE", ...(data.notes ? { notes: auth.job.notes ? `${auth.job.notes}\n\nCompletion: ${data.notes}` : `Completion: ${data.notes}` } : {}) } }),
    ]);
    await recordAudit({ actor: auth.user, action: "JOB_COMPLETED_FIELD", entityType: "Job", entityId: id, details: { title: auth.job.title, durationMinutes, notes: data.notes || null } });
    return NextResponse.json({ ok: true, durationMinutes });
  }

  await prisma.$transaction([
    prisma.jobEvent.create({ data: { jobId: id, type: "field-revisit", title: data.reason, startsAt: now, endsAt: now, assignedToId: auth.user.id } }),
    prisma.job.update({ where: { id }, data: { status: "SCHEDULED", notes: auth.job.notes ? `${auth.job.notes}\n\nRevisit required: ${data.reason}` : `Revisit required: ${data.reason}` } }),
  ]);
  await recordAudit({ actor: auth.user, action: "JOB_REVISIT_REQUIRED", entityType: "Job", entityId: id, details: { title: auth.job.title, durationMinutes, reason: data.reason } });
  return NextResponse.json({ ok: true, durationMinutes });
}
