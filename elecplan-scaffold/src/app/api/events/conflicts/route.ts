import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  assignedToId: z.string().cuid().nullable().optional(),
  jobId: z.string().cuid().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scheduling window" }, { status: 400 });

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (!(endsAt > startsAt)) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

  const assignedToId = user.role === "EMPLOYEE" ? user.id : parsed.data.assignedToId ?? null;
  if (assignedToId) {
    const assignee = await prisma.user.findFirst({ where: { id: assignedToId, businessId, active: true }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: "Assignee not found for this business or inactive" }, { status: 400 });
  }
  if (parsed.data.jobId) {
    const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 404 });
  }

  const conflicts = await prisma.jobEvent.findMany({
    where: {
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      AND: [
        { OR: [{ job: { businessId } }, { jobId: null, assignedTo: { businessId } }] },
        { OR: [
          ...(assignedToId ? [{ assignedToId }] : []),
          ...(parsed.data.jobId ? [{ jobId: parsed.data.jobId }] : []),
        ] },
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 8,
    include: {
      job: { select: { title: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return NextResponse.json({
    conflicts: conflicts.map((event) => ({
      id: event.id,
      title: event.title || event.job?.title || "Calendar event",
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      assignedTo: event.assignedTo?.name ?? null,
    })),
  });
}
