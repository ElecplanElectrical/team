import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  jobId: z.string().cuid(),
  type: z.string().trim().min(1).max(120),
  date: z.string().datetime(),
  status: z.enum(["SCHEDULED", "PASSED", "FAILED"]),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage inspections" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inspection details", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const inspection = await prisma.inspection.create({
      data: {
        jobId: parsed.data.jobId,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        status: parsed.data.status,
      },
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create inspection. Check the linked job." }, { status: 400 });
  }
}
