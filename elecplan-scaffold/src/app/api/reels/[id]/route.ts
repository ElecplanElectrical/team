import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const patchSchema = z.object({ status: z.enum(["IDEA", "READY", "SCHEDULED", "PUBLISHED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canAccess(user.role, "reels")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!actor?.active || !actor.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.reelIdea.findFirst({ where: { id, businessId: actor.businessId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.reelIdea.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
