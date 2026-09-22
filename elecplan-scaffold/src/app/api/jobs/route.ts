import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { JobClientError, resolveJobClient } from "@/lib/resolve-job-client";

const jobSchema = z.object({
  title: z.string().trim().min(1).max(160),
  clientId: z.string().trim().min(1).optional(),
  clientName: z.string().trim().min(1).max(160).optional(),
  address: z.string().trim().max(240).optional().default(""),
  crewIds: z.array(z.string().trim().min(1)).max(50).default([]),
  status: z.enum(["QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETE", "INVOICED"]).default("SCHEDULED"),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
}).refine((data) => Boolean(data.clientId) !== Boolean(data.clientName), {
  message: "Select an existing client or enter a new client name.", path: ["clientName"],
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Only admins and supervisors can create jobs" }, { status: 403 });
  }
  const parsed = jobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (Boolean(d.scheduledStart) !== Boolean(d.scheduledEnd)) {
    return NextResponse.json({ error: "Scheduled start and end must be provided together" }, { status: 400 });
  }
  const start = d.scheduledStart ? new Date(d.scheduledStart) : null;
  const end = d.scheduledEnd ? new Date(d.scheduledEnd) : null;
  if (start && end && end <= start) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  const uniqueCrew = [...new Set(d.crewIds)];
  const primaryId = uniqueCrew[0] ?? null;

  try {
    const save = () => prisma.$transaction(async (tx) => {
      const activeCrew = uniqueCrew.length
        ? await tx.user.findMany({ where: { id: { in: uniqueCrew }, active: true }, select: { id: true } }) : [];
      if (activeCrew.length !== uniqueCrew.length) {
        throw new JobClientError("One or more assigned workers are inactive or invalid", 400);
      }
      const resolved = await resolveJobClient(tx, { clientId: d.clientId, clientName: d.clientName });
      const job = await tx.job.create({
        data: {
          title: d.title, clientId: resolved.client.id, address: d.address,
          assignedToId: primaryId, crew: { connect: uniqueCrew.map((id) => ({ id })) },
          status: d.status, scheduledStart: start, scheduledEnd: end, notes: d.notes || null,
        },
        include: { client: { select: { name: true } }, assignedTo: { select: { name: true } }, crew: { select: { id: true, name: true } } },
      });
      if (start && end) await tx.jobEvent.create({ data: { jobId: job.id, type: "job", startsAt: start, endsAt: end, assignedToId: primaryId } });
      return { job, newClient: resolved.created ? resolved.client : null };
    }, { isolationLevel: "Serializable" });

    // Two people adding the same new name at once must resolve to one client.
    let saved: Awaited<ReturnType<typeof save>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { saved = await save(); break; }
      catch (error) {
        const conflict = typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
        if (!conflict || attempt === 2) throw error;
      }
    }
    if (!saved) throw new Error("Job transaction did not complete");
    const { job, newClient } = saved;
    if (newClient) await recordAudit({ actor: user, action: "CLIENT_CREATED", entityType: "Client", entityId: newClient.id, details: { name: newClient.name, source: "job", jobId: job.id } });
    await recordAudit({ actor: user, action: "JOB_CREATED", entityType: "Job", entityId: job.id, details: { title: job.title, clientId: job.clientId, crewIds: uniqueCrew, status: job.status, scheduled: Boolean(job.scheduledStart && job.scheduledEnd) } });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof JobClientError) return NextResponse.json({ error: error.message, clients: error.clients }, { status: error.status });
    return NextResponse.json({ error: "Could not create the job. Please try again." }, { status: 500 });
  }
}
