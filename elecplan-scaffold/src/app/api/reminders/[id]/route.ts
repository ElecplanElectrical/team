import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const body = await req.json().catch(() => null) as { completed?: boolean } | null;
  if (typeof body?.completed !== "boolean") return NextResponse.json({ error: "Completed flag is required" }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.reminder.findFirst({ where: { id, businessId, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Reminder not found for this business" }, { status: 404 });

  const updated = await prisma.reminder.updateMany({ where: { id, businessId, userId: user.id }, data: { completed: body.completed } });
  if (updated.count !== 1) return NextResponse.json({ error: "Reminder not found for this business" }, { status: 404 });
  const reminder = await prisma.reminder.findFirst({ where: { id, businessId, userId: user.id } });
  return NextResponse.json(reminder);
}
