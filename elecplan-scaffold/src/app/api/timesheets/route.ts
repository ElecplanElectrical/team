import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  date: z.string().datetime(),
  hours: z.number().positive().max(24),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid timesheet entry", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const entry = await prisma.timesheet.create({
      data: {
        userId: user.id,
        date: new Date(parsed.data.date),
        hours: parsed.data.hours,
        status: "PENDING",
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create timesheet entry" }, { status: 400 });
  }
}
