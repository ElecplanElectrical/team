import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const body = await req.json().catch(() => null) as { title?: string; dueDate?: string | null; tag?: string | null } | null;
  const title = body?.title?.trim();
  const tag = body?.tag?.trim() || null;
  const dueDate = body?.dueDate ? new Date(body.dueDate) : null;
  if (!title) return NextResponse.json({ error: "Reminder title is required" }, { status: 400 });
  if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });

  const reminder = await prisma.reminder.create({ data: { businessId, userId: user.id, title, dueDate, tag } });
  return NextResponse.json(reminder, { status: 201 });
}
