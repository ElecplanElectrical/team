import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { completed?: boolean } | null;
  if (typeof body?.completed !== "boolean") return NextResponse.json({ error: "Completed flag is required" }, { status: 400 });

  const { id } = await params;
  const existing = await prisma.reminder.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== user.id) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

  const reminder = await prisma.reminder.update({ where: { id }, data: { completed: body.completed } });
  return NextResponse.json(reminder);
}
