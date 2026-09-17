import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

async function ownedReminder(id: string, userId: string) {
  const existing = await prisma.reminder.findUnique({ where: { id }, select: { userId: true } });
  return existing && existing.userId === userId ? existing : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { completed?: boolean } | null;
  if (typeof body?.completed !== "boolean") return NextResponse.json({ error: "Completed flag is required" }, { status: 400 });

  const { id } = await params;
  if (!await ownedReminder(id, user.id)) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

  const reminder = await prisma.reminder.update({ where: { id }, data: { completed: body.completed } });
  return NextResponse.json(reminder);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await ownedReminder(id, user.id)) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
