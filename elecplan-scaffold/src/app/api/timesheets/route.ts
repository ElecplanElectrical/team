import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  weekStart: z.string().datetime().optional(),
  date: z.string().datetime().optional(),
  hours: z.number().positive().max(168),
}).refine((value) => Boolean(value.weekStart || value.date), { message: "Week start is required" });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid timesheet entry", issues: parsed.error.flatten() }, { status: 400 });

  const rawWeekStart = parsed.data.weekStart || parsed.data.date;
  if (!rawWeekStart) return NextResponse.json({ error: "Week start is required" }, { status: 400 });

  try {
    const entry = await prisma.timesheet.create({
      data: {
        userId: user.id,
        weekStart: new Date(rawWeekStart),
        hours: parsed.data.hours,
        status: "PENDING",
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create timesheet entry" }, { status: 400 });
  }
}
