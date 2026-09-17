import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

const schema = z.object({
  userId: z.string().cuid(),
  weekStart: z.string().date(),
  jobsComplete: z.number().int().min(0).max(1000),
  hoursWorked: z.number().min(0).max(1000),
  reworkCount: z.number().int().min(0).max(1000),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  await requireAccess("kpis");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter valid weekly KPI figures." }, { status: 400 });

  const weekStart = new Date(`${parsed.data.weekStart}T00:00:00.000Z`);
  const kpi = await prisma.employeeKpi.upsert({
    where: { userId_weekStart: { userId: parsed.data.userId, weekStart } },
    update: {
      jobsComplete: parsed.data.jobsComplete,
      hoursWorked: parsed.data.hoursWorked,
      reworkCount: parsed.data.reworkCount,
      notes: parsed.data.notes || null,
    },
    create: {
      userId: parsed.data.userId,
      weekStart,
      jobsComplete: parsed.data.jobsComplete,
      hoursWorked: parsed.data.hoursWorked,
      reworkCount: parsed.data.reworkCount,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({
    id: kpi.id,
    userId: kpi.userId,
    weekStart: kpi.weekStart.toISOString().slice(0, 10),
    jobsComplete: kpi.jobsComplete,
    hoursWorked: Number(kpi.hoursWorked),
    reworkCount: kpi.reworkCount,
    notes: kpi.notes,
  }, { status: 201 });
}
