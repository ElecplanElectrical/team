import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.union([
  z.object({ delta: z.number().int().min(-1000).max(1000).refine((v) => v !== 0) }),
  z.object({ onHand: z.number().int().min(0) }),
  z.object({ name: z.string().min(2).max(160), supplier: z.string().max(100).nullable().optional() }),
]);

async function tenantUser() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return { error: NextResponse.json({ error: "No active customer business selected." }, { status: 409 }) };
  return { user, businessId: dbUser.businessId };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await tenantUser();
  if ("error" in auth) return auth.error;
  const { user, businessId } = auth;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const { id } = await params;

  const current = await prisma.stockItem.findFirst({ where: { id, businessId }, select: { id: true, name: true, onHand: true } });
  if (!current) return NextResponse.json({ error: "Material item not found for this business" }, { status: 404 });

  if ("name" in parsed.data) {
    await prisma.stockItem.updateMany({ where: { id, businessId }, data: { name: parsed.data.name, supplier: parsed.data.supplier ?? undefined } });
    const item = await prisma.stockItem.findFirst({ where: { id, businessId } });
    return NextResponse.json(item);
  }

  if ("delta" in parsed.data) {
    const delta = parsed.data.delta;
    const result = await prisma.stockItem.updateMany({ where: { id, businessId, ...(delta < 0 ? { onHand: { gte: Math.abs(delta) } } : {}) }, data: { onHand: delta > 0 ? { increment: delta } : { decrement: Math.abs(delta) } } });
    if (!result.count) return NextResponse.json({ error: "Material quantity changed. Refresh and try again." }, { status: 409 });
    const item = await prisma.stockItem.findFirst({ where: { id, businessId } });
    if (!item) return NextResponse.json({ error: "Material item not found for this business" }, { status: 404 });
    await recordAudit({ actor: user, action: "STOCK_QUANTITY_CHANGED", entityType: "StockItem", entityId: item.id, details: { businessId, name: item.name, before: item.onHand - delta, after: item.onHand, delta, mode: "delta" } });
    return NextResponse.json(item);
  }

  await prisma.stockItem.updateMany({ where: { id, businessId }, data: { onHand: parsed.data.onHand } });
  const item = await prisma.stockItem.findFirst({ where: { id, businessId } });
  if (!item) return NextResponse.json({ error: "Material item not found for this business" }, { status: 404 });
  if (current.onHand !== item.onHand) await recordAudit({ actor: user, action: "STOCK_QUANTITY_CHANGED", entityType: "StockItem", entityId: item.id, details: { businessId, name: item.name, before: current.onHand, after: item.onHand, delta: item.onHand - current.onHand, mode: "absolute" } });
  return NextResponse.json(item);
}
