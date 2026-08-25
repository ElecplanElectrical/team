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

async function businessFor(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { businessId: true, active: true } });
}

export async function GET() {
  const user = await requireAccess("dashboard");
  const actor = await businessFor(user.id);
  if (!actor?.active || !actor.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const goal = await prisma.weeklyGoal.findUnique({ where: { businessId_weekStart: { businessId: actor.businessId, weekStart: weekStart() } } });
  return NextResponse.json({ goal: goal?.text ?? "" });
}

export async function PUT(request: Request) {
  const user = await requireAccess("dashboard");
  const actor = await businessFor(user.id);
  if (!actor?.active || !actor.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 500) : "";
  const start = weekStart();
  const goal = await prisma.weeklyGoal.upsert({
    where: { businessId_weekStart: { businessId: actor.businessId, weekStart: start } },
    update: { text, createdBy: user.id },
    create: { businessId: actor.businessId, weekStart: start, text, createdBy: user.id },
  });
  return NextResponse.json({ goal: goal.text });
}
