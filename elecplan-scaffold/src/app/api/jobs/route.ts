import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

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

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can create jobs" }, { status: 403 });
  }

  const parsed = jobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const start = d.scheduledStart ? new Date(d.scheduledStart) : null;
  const end = d.scheduledEnd ? new Date(d.scheduledEnd) : null;
  if (start && end && end <= start) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  try {
    const [client, assignee] = await Promise.all([
      prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } }),
      d.assignedToId
        ? prisma.user.findFirst({ where: { id: d.assignedToId, active: true }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (d.assignedToId && !assignee) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title: d.title,
        clientId: d.clientId,
        address: d.address,
        assignedToId: d.assignedToId || null,
        status: d.status,
        scheduledStart: start,
        scheduledEnd: end,
        notes: d.notes || null,
      },
      include: {
        client: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create job" }, { status: 400 });
  }
}
