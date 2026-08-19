import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can schedule revisits" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid revisit date and time" }, { status: 400 });
  const start = new Date(parsed.data.scheduledStart);
  const end = new Date(parsed.data.scheduledEnd);
  if (end <= start) return NextResponse.json({ error: "Revisit end time must be after the start time" }, { status: 400 });

  const { id } = await context.params;
  const job = await prisma.job.findUnique({ where: { id }, select: { id:true,title:true,assignedToId:true,scheduledStart:true,scheduledEnd:true,notes:true } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    const lastRevisitStop = await tx.jobEvent.findFirst({ where: { jobId:id, type:"field-revisit" }, orderBy:{ startsAt:"desc" } });
    if (lastRevisitStop) {
      const arrival = await tx.jobEvent.findFirst({ where:{ jobId:id, type:"field-arrived", startsAt:{ lte:lastRevisitStop.startsAt } }, orderBy:{ startsAt:"desc" } });
      if (arrival) {
        const existingHistory = await tx.jobEvent.findFirst({ where:{ jobId:id, type:"job-history", startsAt:arrival.startsAt } });
        if (!existingHistory) {
          await tx.jobEvent.create({ data:{ jobId:id, type:"job-history", title:job.title, startsAt:arrival.startsAt, endsAt:lastRevisitStop.startsAt, assignedToId:arrival.assignedToId ?? job.assignedToId } });
        }
      }
    }

    const existingRevisit = await tx.jobEvent.findFirst({ where:{ jobId:id, type:"revisit" }, orderBy:{ startsAt:"desc" } });
    if (existingRevisit) {
      await tx.jobEvent.update({ where:{ id:existingRevisit.id }, data:{ title:`${job.title} — Rescheduled`, startsAt:start, endsAt:end, assignedToId:job.assignedToId } });
    } else {
      const movedJobEvent = job.scheduledStart ? await tx.jobEvent.findFirst({ where:{ jobId:id, type:"job", startsAt:job.scheduledStart } }) : null;
      if (movedJobEvent && lastRevisitStop) {
        await tx.jobEvent.update({ where:{ id:movedJobEvent.id }, data:{ type:"revisit", title:`${job.title} — Rescheduled`, startsAt:start, endsAt:end, assignedToId:job.assignedToId } });
      } else {
        await tx.jobEvent.create({ data:{ jobId:id, type:"revisit", title:`${job.title} — Rescheduled`, startsAt:start, endsAt:end, assignedToId:job.assignedToId } });
      }
    }

    await tx.job.update({ where:{ id }, data:{ status:"SCHEDULED", scheduledStart:start, scheduledEnd:end } });
  });

  await recordAudit({ actor:user, action:"JOB_REVISIT_SCHEDULED", entityType:"Job", entityId:id, details:{ title:job.title, scheduledStart:start.toISOString(), scheduledEnd:end.toISOString() } });
  return NextResponse.json({ ok:true, scheduledStart:start.toISOString(), scheduledEnd:end.toISOString() });
}
