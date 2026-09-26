import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const isoDateTime = z.string().datetime({ offset: true });

const proposal = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("event"),
    title: z.string().trim().min(1).max(120),
    jobId: z.string().cuid().optional(),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    kind: z.literal("material"),
    title: z.string().trim().min(1).max(200),
    jobId: z.string().cuid(),
    materialId: z.string().cuid(),
    quantity: z.coerce.number().positive().max(10000),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    kind: z.literal("complete_job"),
    title: z.string().trim().min(1).max(200),
    jobId: z.string().cuid(),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    kind: z.literal("reminder"),
    title: z.string().trim().min(1).max(200),
    dueDate: isoDateTime.optional(),
    notes: z.string().max(2000).optional(),
  }),
]);

const schema = z.object({ proposals: z.array(proposal).min(1).max(50) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "aiAssistant")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assistant proposals", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const created = await prisma.$transaction(async (tx) => {
      const output: Array<{ kind: string; id: string }> = [];

      for (const item of parsed.data.proposals) {
        if (item.kind === "event") {
          const startsAt = new Date(item.startsAt);
          const endsAt = new Date(item.endsAt);
          if (endsAt <= startsAt) throw new Error("INVALID_EVENT_RANGE");

          if (item.jobId) {
            const job = await tx.job.findUnique({ where: { id: item.jobId }, select: { status: true } });
            if (!job) throw new Error("JOB_NOT_FOUND");

            const row = await tx.jobEvent.create({
              data: { title: item.title, notes: item.notes?.trim() || null, type: "job", jobId: item.jobId, startsAt, endsAt },
            });
            await tx.job.update({
              where: { id: item.jobId },
              data: { scheduledStart: startsAt, scheduledEnd: endsAt, ...(job.status === "QUOTED" ? { status: "SCHEDULED" as const } : {}) },
            });
            output.push({ kind: "event", id: row.id });
          } else {
            const row = await tx.jobEvent.create({
              data: { title: item.title, notes: item.notes?.trim() || null, type: "event", startsAt, endsAt },
            });
            output.push({ kind: "event", id: row.id });
          }
        } else if (item.kind === "complete_job") {
          const job = await tx.job.findUnique({ where: { id: item.jobId }, select: { id: true, status: true } });
          if (!job) throw new Error("JOB_NOT_FOUND");
          const used = await tx.jobMaterial.findMany({ where: { jobId: job.id, stockAppliedAt: null }, select: { id: true, materialId: true, name: true, quantity: true } });
          for (const usedItem of used) {
            const material = await tx.material.findUnique({ where: { id: usedItem.materialId }, select: { stockOnHand: true } });
            if (!material) continue;
            const next = Number(material.stockOnHand) - Number(usedItem.quantity);
            if (next < 0) throw new Error("INSUFFICIENT_STOCK:" + usedItem.name);
            await tx.material.update({ where: { id: usedItem.materialId }, data: { stockOnHand: next } });
            await tx.jobMaterial.update({ where: { id: usedItem.id }, data: { stockAppliedAt: new Date() } });
          }
          await tx.job.update({ where: { id: job.id }, data: { status: "COMPLETE", ...(item.notes ? { notes: item.notes } : {}) } });
          output.push({ kind: "complete_job", id: job.id });
        } else if (item.kind === "material") {
          const [job, material] = await Promise.all([
            tx.job.findUnique({ where: { id: item.jobId }, select: { id: true } }),
            tx.material.findUnique({ where: { id: item.materialId }, select: { id: true, name: true, unit: true } }),
          ]);
          if (!job) throw new Error("JOB_NOT_FOUND");
          if (!material) throw new Error("MATERIAL_NOT_FOUND");
          const row = await tx.jobMaterial.create({ data: { jobId: job.id, materialId: material.id, name: material.name, quantity: item.quantity, unit: material.unit } });
          output.push({ kind: "material", id: row.id });
        } else {
          const row = await tx.reminder.create({ data: { userId: user.id, title: item.title, dueAt: item.dueDate ? new Date(item.dueDate) : new Date() } });
          output.push({ kind: "reminder", id: row.id });
        }
      }

      return output;
    });

    await recordAudit({
      actor: user,
      action: "AI_ASSISTANT_APPLIED",
      entityType: "AiAssistant",
      details: { created: created.length, items: created },
    });

    return NextResponse.json({ created: created.length, items: created }, { status: 201 });
  } catch (error) {
    console.error("AI_ASSISTANT_APPLY_FAILED", error);
    return NextResponse.json({ error: "Could not apply assistant changes" }, { status: 400 });
  }
}
