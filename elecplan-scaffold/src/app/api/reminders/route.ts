import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "reminders")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { title?: string; dueAt?: string | null; dueDate?: string | null } | null;
  const title = body?.title?.trim();
  const rawDue = body?.dueAt || body?.dueDate;
  const dueAt = rawDue ? new Date(rawDue) : null;

  if (!title) return NextResponse.json({ error: "Reminder title is required" }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "Valid reminder due date is required" }, { status: 400 });

  const reminder = await prisma.reminder.create({ data: { userId: user.id, title, dueAt } });
  return NextResponse.json(reminder, { status: 201 });
}
