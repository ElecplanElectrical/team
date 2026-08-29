import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, canManageUser } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(actor.role, "employees")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actorRecord = await prisma.user.findUnique({ where: { id: actor.id }, select: { businessId: true, active: true } });
  if (!actorRecord?.active || !actorRecord.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = actorRecord.businessId;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findFirst({ where: { id, businessId }, select: { id: true, role: true, active: true, email: true } });
  if (!target) return NextResponse.json({ error: "User not found for this business" }, { status: 404 });
  if (!canManageUser(actor.role, target.role)) return NextResponse.json({ error: "You cannot manage this user." }, { status: 403 });
  if (target.id === actor.id && parsed.data.active === false) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });

  if (target.role === "ADMIN" && target.active && parsed.data.active === false) {
    const activeAdmins = await prisma.user.count({ where: { businessId, role: "ADMIN", active: true } });
    if (activeAdmins <= 1) return NextResponse.json({ error: "Keep at least one active administrator for this business." }, { status: 400 });
  }

  const operations = [
    prisma.user.updateMany({ where: { id, businessId }, data: { active: parsed.data.active } }),
    ...(parsed.data.active === false ? [prisma.passwordToken.deleteMany({ where: { userId: id, usedAt: null } })] : []),
  ];
  const [updated] = await prisma.$transaction(operations);
  if (!("count" in updated) || updated.count !== 1) return NextResponse.json({ error: "User not found for this business" }, { status: 404 });

  await recordAudit({ actor, action: parsed.data.active ? "USER_REACTIVATED" : "USER_DEACTIVATED", entityType: "User", entityId: target.id, details: { businessId, targetRole: target.role, targetEmail: target.email, fromActive: target.active, toActive: parsed.data.active } });
  return NextResponse.json({ id, active: parsed.data.active });
}
