import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["SCHEDULED", "PASSED", "FAILED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage inspections" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { id } = await params;
  const before = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, status: true, jobId: true, type: true, date: true },
  });
  if (!before) return NextResponse.json({ error: "Inspection not found" }, { status: 404 });

  try {
    const inspection = await prisma.inspection.update({ where: { id }, data: parsed.data });

    if (before.status !== inspection.status) {
      await recordAudit({
        actor: user,
        action: "INSPECTION_STATUS_CHANGED",
        entityType: "Inspection",
        entityId: inspection.id,
        details: {
          jobId: before.jobId,
          type: before.type,
          date: before.date.toISOString().slice(0, 10),
          from: before.status,
          to: inspection.status,
        },
      });
    }

    return NextResponse.json(inspection);
  } catch {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }
}
