import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, canManageUser } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({ active: z.boolean().optional(), name: z.string().trim().min(1).max(120).optional(), email: z.string().trim().email().max(160).optional(), phone: z.string().trim().max(40).nullable().optional(), licenseNumber: z.string().trim().max(80).nullable().optional(), licenseExpiry: z.string().datetime().nullable().optional() }).refine((value) => Object.values(value).some((item) => item !== undefined), "No changes supplied");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getSessionUser("employees");
  if (!actor) return NextResponse.json({ error: "Unauthorized or Employees module disabled" }, { status: 403 });
  if (!canAccess(actor.role, "employees")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!actor.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = actor.businessId;
  const business = await prisma.businessPortal.findUnique({ where: { id: businessId }, select: { contactEmail: true } });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const target = await prisma.user.findFirst({ where: { id, businessId }, select: { id: true, role: true, active: true, email: true, name: true, phone: true, licenseNumber: true, licenseExpiry: true } });
  if (!target) return NextResponse.json({ error: "User not found for this business" }, { status: 404 });
  if (!canManageUser(actor.role, target.role)) return NextResponse.json({ error: "You cannot manage this user." }, { status: 403 });
  if (target.id === actor.id && parsed.data.active === false) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  const ownerEmail = business?.contactEmail?.trim().toLowerCase() ?? null;
  if (parsed.data.active === false && ownerEmail && target.email.trim().toLowerCase() === ownerEmail && target.id !== actor.id) return NextResponse.json({ error: "The designated Owner Admin cannot be deactivated by another customer administrator." }, { status: 403 });
  if (target.role === "ADMIN" && target.active && parsed.data.active === false) { const activeAdmins = await prisma.user.count({ where: { businessId, role: "ADMIN", active: true } }); if (activeAdmins <= 1) return NextResponse.json({ error: "Keep at least one active administrator for this business." }, { status: 400 }); }
  if (parsed.data.email && parsed.data.email.toLowerCase() !== target.email.toLowerCase()) { const duplicate = await prisma.user.findUnique({ where: { email: parsed.data.email } }); if (duplicate && duplicate.id !== id) return NextResponse.json({ error: "That email is already in use." }, { status: 409 }); }
  const data = parsed.data;
  const updateData = { ...(data.active !== undefined ? { active: data.active } : {}), ...(data.name !== undefined ? { name: data.name } : {}), ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}), ...(data.phone !== undefined ? { phone: data.phone || null } : {}), ...(data.licenseNumber !== undefined ? { licenseNumber: data.licenseNumber || null } : {}), ...(data.licenseExpiry !== undefined ? { licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null } : {}) };
  const operations = [prisma.user.updateMany({ where: { id, businessId }, data: updateData }), ...(data.active === false ? [prisma.passwordToken.deleteMany({ where: { userId: id, usedAt: null } })] : [])];
  const [updated] = await prisma.$transaction(operations);
  if (!("count" in updated) || updated.count !== 1) return NextResponse.json({ error: "User not found for this business" }, { status: 404 });
  await recordAudit({ actor, action: data.active !== undefined ? (data.active ? "USER_REACTIVATED" : "USER_DEACTIVATED") : "USER_UPDATED", entityType: "User", entityId: target.id, details: { businessId, targetRole: target.role, targetEmail: target.email, changedFields: Object.keys(data) } });
  return NextResponse.json({ id, ...updateData });
}
