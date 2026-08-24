import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["PENDING", "APPROVED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can approve timesheets" }, { status: 403 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;

  const before = await prisma.timesheet.findFirst({ where: { id, businessId }, select: { id: true, status: true, userId: true, date: true, hours: true } });
  if (!before) return NextResponse.json({ error: "Timesheet entry not found for this business" }, { status: 404 });

  const updated = await prisma.timesheet.updateMany({ where: { id, businessId }, data: parsed.data });
  if (updated.count !== 1) return NextResponse.json({ error: "Timesheet entry not found for this business" }, { status: 404 });
  const entry = await prisma.timesheet.findFirst({ where: { id, businessId } });
  await recordAudit({ actor: user, action: "TIMESHEET_STATUS_CHANGED", entityType: "Timesheet", entityId: id, details: { businessId, userId: before.userId, from: before.status, to: parsed.data.status, date: before.date.toISOString().slice(0, 10), hours: Number(before.hours) } });
  return NextResponse.json(entry);
}
