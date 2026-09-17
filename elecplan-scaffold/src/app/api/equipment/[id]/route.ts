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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const current = await prisma.equipment.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Equipment not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  const data = parsed.data;

  if (user.role === "EMPLOYEE" && (data.action === "STATUS" || data.action === "QUANTITY")) {
    return NextResponse.json({ error: "Only admin or supervisor can change equipment stock" }, { status: 403 });
  }

  if (data.action === "QUANTITY") {
    if (data.quantity === undefined) return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
    await prisma.equipment.update({ where: { id }, data: { quantity: data.quantity } });
    return NextResponse.json({ ok: true });
  }

  if (data.action === "STOCKTAKE") {
    if (data.notes !== undefined) await prisma.equipment.update({ where: { id }, data: { notes: data.notes } });
    return NextResponse.json({ ok: true });
  }

  const location = data.location ?? current.location ?? "Workshop";
  const status = data.action === "STATUS"
    ? (data.status ?? current.status)
    : data.assignedJobId
      ? "ON_JOB"
      : data.assignedUserId
        ? "ASSIGNED"
        : "AVAILABLE";

  await prisma.equipment.update({
    where: { id },
    data: { location, status, assignedTo: data.assignedUserId ?? null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only an admin can delete equipment" }, { status: 403 });
  const { id } = await ctx.params;
  await prisma.equipment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
