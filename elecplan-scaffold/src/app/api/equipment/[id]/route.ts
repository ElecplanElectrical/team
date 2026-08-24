import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  action: z.enum(["MOVE", "STOCKTAKE", "STATUS", "QUANTITY"]),
  location: z.string().trim().max(160).optional(),
  assignedUserId: z.string().optional().nullable(),
  assignedJobId: z.string().optional().nullable(),
  status: z.string().trim().max(40).optional(),
  quantity: z.number().int().min(0).max(100000).optional(),
  notes: z.string().trim().max(800).optional().nullable(),
});

async function tenantActor() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return { error: NextResponse.json({ error: "No active customer business selected." }, { status: 409 }) };
  return { user, businessId: dbUser.businessId };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await tenantActor();
  if ("error" in auth) return auth.error;
  const { user, businessId } = auth;
  const { id } = await ctx.params;

  const current = await prisma.equipment.findFirst({ where: { id, businessId } });
  if (!current) return NextResponse.json({ error: "Equipment not found for this business" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  const d = parsed.data;

  if (user.role === "EMPLOYEE" && (d.action === "STATUS" || d.action === "QUANTITY")) {
    return NextResponse.json({ error: "Only admin or supervisor can change equipment stock" }, { status: 403 });
  }

  if (d.assignedUserId) {
    const assignee = await prisma.user.findFirst({ where: { id: d.assignedUserId, businessId, active: true }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: "Assigned employee not found for this business or inactive" }, { status: 400 });
  }
  if (d.assignedJobId) {
    const job = await prisma.job.findFirst({ where: { id: d.assignedJobId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Assigned job not found for this business" }, { status: 400 });
  }

  if (d.action === "QUANTITY") {
    if (d.quantity === undefined) return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
    await prisma.$transaction(async (tx) => {
      const updated = await tx.equipment.updateMany({ where: { id, businessId }, data: { quantity: d.quantity } });
      if (updated.count !== 1) throw new Error("EQUIPMENT_NOT_FOUND");
      await tx.equipmentMovement.create({ data: { equipmentId: id, actorId: user.id, action: "QUANTITY", fromLocation: current.location, toLocation: current.location, notes: `Quantity ${current.quantity} -> ${d.quantity}` } });
    });
    return NextResponse.json({ ok: true });
  }

  if (d.action === "STOCKTAKE") {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.equipment.updateMany({ where: { id, businessId }, data: { lastStocktakeAt: new Date() } });
      if (updated.count !== 1) throw new Error("EQUIPMENT_NOT_FOUND");
      await tx.equipmentMovement.create({ data: { equipmentId: id, actorId: user.id, action: "STOCKTAKE", fromLocation: current.location, toLocation: current.location, notes: d.notes || `Quantity checked: ${current.quantity}` } });
    });
    return NextResponse.json({ ok: true });
  }

  const location = d.location ?? current.location;
  const status = d.action === "STATUS" ? (d.status ?? current.status) : (d.assignedJobId ? "ON_JOB" : d.assignedUserId ? "ASSIGNED" : "AVAILABLE");

  await prisma.$transaction(async (tx) => {
    const updated = await tx.equipment.updateMany({ where: { id, businessId }, data: { location, status, assignedUserId: d.assignedUserId ?? null, assignedJobId: d.assignedJobId ?? null } });
    if (updated.count !== 1) throw new Error("EQUIPMENT_NOT_FOUND");
    await tx.equipmentMovement.create({ data: { equipmentId: id, actorId: user.id, action: d.action, fromLocation: current.location, toLocation: location, assignedUserId: d.assignedUserId ?? null, assignedJobId: d.assignedJobId ?? null, notes: d.notes || null } });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await tenantActor();
  if ("error" in auth) return auth.error;
  const { user, businessId } = auth;
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only an admin can delete equipment" }, { status: 403 });

  const { id } = await ctx.params;
  const existing = await prisma.equipment.findFirst({ where: { id, businessId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Equipment not found for this business" }, { status: 404 });

  const deleted = await prisma.equipment.deleteMany({ where: { id, businessId } });
  if (deleted.count !== 1) return NextResponse.json({ error: "Equipment not found for this business" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
