import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reminders = await prisma.reminder.findMany({ where: { userId: user.id }, orderBy: [{ completed: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(reminders.map(reminder => ({ id: reminder.id, title: reminder.title, completed: reminder.completed })));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = body?.title?.trim();

  if (!title) return NextResponse.json({ error: "Task name is required" }, { status: 400 });

  const reminder = await prisma.reminder.create({ data: { userId: user.id, title, dueAt: new Date() } });
  return NextResponse.json(reminder, { status: 201 });
}
