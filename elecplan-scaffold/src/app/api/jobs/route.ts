import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const jobSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  clientId: z.string().trim().min(1, "Client is required"),
  address: z.string().trim().min(1, "Address is required").max(240),
  assignedToId: z.string().trim().optional().nullable(),
  status: z.enum(["QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETE", "INVOICED"]).default("SCHEDULED"),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

async function context() {
  const user = await getSessionUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true } });
  if (!dbUser?.businessId) return null;
  return { user, businessId: dbUser.businessId };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "Unauthorized or no customer business selected" }, { status: 401 });
  const { user, businessId } = ctx;

  const jobs = await prisma.job.findMany({
    where: {
      businessId,
      ...(user.role === "EMPLOYEE" ? { assignedToId: user.id } : {}),
    },
    select: {
      id: true,
      title: true,
      address: true,
      status: true,
      scheduledStart: true,
      scheduledEnd: true,
      notes: true,
      client: { select: { id: true, name: true, contactName: true, phone: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ scheduledStart: "asc" }, { title: "asc" }],
  });

  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "Unauthorized or no customer business selected" }, { status: 401 });
  const { user, businessId } = ctx;
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can create jobs" }, { status: 403 });

  const parsed = jobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (Boolean(d.scheduledStart) !== Boolean(d.scheduledEnd)) return NextResponse.json({ error: "Scheduled start and end must be provided together" }, { status: 400 });
  const start = d.scheduledStart ? new Date(d.scheduledStart) : null;
  const end = d.scheduledEnd ? new Date(d.scheduledEnd) : null;
  if (start && end && end <= start) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

  try {
    const [client, assignee] = await Promise.all([
      prisma.client.findFirst({ where: { id: d.clientId, businessId }, select: { id: true } }),
      d.assignedToId ? prisma.user.findFirst({ where: { id: d.assignedToId, businessId, active: true }, select: { id: true } }) : Promise.resolve(null),
    ]);
    if (!client) return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });
    if (d.assignedToId && !assignee) return NextResponse.json({ error: "Assigned employee not found for this business or inactive" }, { status: 400 });

    const job = await prisma.$transaction(async (tx) => {
      const created = await tx.job.create({
        data: { businessId, title: d.title, clientId: d.clientId, address: d.address, assignedToId: d.assignedToId || null, status: d.status, scheduledStart: start, scheduledEnd: end, notes: d.notes || null },
        include: { client: { select: { name: true } }, assignedTo: { select: { name: true } } },
      });
      if (start && end) await tx.jobEvent.create({ data: { jobId: created.id, type: "job", startsAt: start, endsAt: end, assignedToId: d.assignedToId || null } });
      return created;
    });

    await recordAudit({ actor: user, action: "JOB_CREATED", entityType: "Job", entityId: job.id, details: { businessId, title: job.title, clientId: job.clientId, assignedToId: job.assignedToId, status: job.status } });
    return NextResponse.json(job, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create job" }, { status: 400 });
  }
}
