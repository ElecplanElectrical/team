import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

function weekStart() {
  const now = new Date();
  const melbourne = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  const day = melbourne.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  melbourne.setDate(melbourne.getDate() + diff);
  melbourne.setHours(0, 0, 0, 0);
  return melbourne;
}

export async function GET() {
  await requireAccess("dashboard");
  const goal = await prisma.weeklyGoal.findUnique({ where: { weekStart: weekStart() } });
  return NextResponse.json({ goal: goal?.text ?? "" });
}

export async function PUT(request: Request) {
  const user = await requireAccess("dashboard");
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 500) : "";
  const start = weekStart();
  const goal = await prisma.weeklyGoal.upsert({
    where: { weekStart: start },
    update: { text, createdBy: user.id },
    create: { weekStart: start, text, createdBy: user.id },
  });
  return NextResponse.json({ goal: goal.text });
}
