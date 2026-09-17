import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.union([
  z.object({ delta: z.number().min(-1000).max(1000).refine((v) => v !== 0) }),
  z.object({ onHand: z.number().min(0) }),
  z.object({ name: z.string().min(2).max(160), supplier: z.string().max(100).nullable().optional() }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const { id } = await params;

  if ("name" in parsed.data) {
    try {
      return NextResponse.json(await prisma.material.update({ where: { id }, data: { name: parsed.data.name, supplier: parsed.data.supplier ?? undefined } }));
    } catch {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
  }

  const before = await prisma.material.findUnique({ where: { id }, select: { id: true, name: true, stockOnHand: true } });
  if (!before) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  const beforeQty = Number(before.stockOnHand);
  const afterQty = "delta" in parsed.data ? beforeQty + parsed.data.delta : parsed.data.onHand;
  if (afterQty < 0) return NextResponse.json({ error: "Stock quantity changed. Refresh and try again." }, { status: 409 });

  try {
    const item = await prisma.material.update({ where: { id }, data: { stockOnHand: afterQty } });
    const finalQty = Number(item.stockOnHand);
    if (finalQty !== beforeQty) {
      await recordAudit({
        actor: user,
        action: "STOCK_QUANTITY_CHANGED",
        entityType: "Material",
        entityId: item.id,
        details: { name: item.name, before: beforeQty, after: finalQty, delta: finalQty - beforeQty, mode: "delta" in parsed.data ? "delta" : "absolute" },
      });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }
}
