import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { canUseMaterialScanner } from "@/lib/material-capabilities";

const schema = z.object({
  barcode: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160).optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  supplier: z.string().trim().max(100).optional().nullable(),
  quantity: z.number().int().min(1).max(9999).optional(),
});

function cleanBarcode(value: string) {
  return value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 64);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  if (!user.business?.modules.includes("materials")) return NextResponse.json({ error: "Materials module is disabled for this business" }, { status: 403 });
  if (!canUseMaterialScanner(user.business?.slug)) return NextResponse.json({ error: "Stock scanning is not enabled for this business" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid barcode is required" }, { status: 400 });
  const barcode = cleanBarcode(parsed.data.barcode);
  if (!barcode) return NextResponse.json({ error: "A valid barcode is required" }, { status: 400 });
  const businessId = user.businessId;

  const existing = await prisma.stockItem.findFirst({ where: { businessId, barcode } });
  if (existing) {
    await prisma.stockItem.updateMany({ where: { id: existing.id, businessId }, data: { onHand: { increment: 1 } } });
    const item = await prisma.stockItem.findFirst({ where: { id: existing.id, businessId } });
    if (!item) return NextResponse.json({ error: "Material item could not be reloaded" }, { status: 409 });
    await recordAudit({ actor: user, action: "STOCK_BARCODE_SCANNED", entityType: "StockItem", entityId: item.id, details: { businessId, barcode, result: "incremented", before: existing.onHand, after: item.onHand } });
    return NextResponse.json({ status: "incremented", item });
  }

  const legacyAlias = await prisma.stockBarcode.findUnique({ where: { barcode }, include: { stockItem: true } });
  if (legacyAlias?.stockItem.businessId === businessId) {
    await prisma.stockItem.updateMany({ where: { id: legacyAlias.stockItemId, businessId }, data: { onHand: { increment: 1 } } });
    const item = await prisma.stockItem.findFirst({ where: { id: legacyAlias.stockItemId, businessId } });
    if (!item) return NextResponse.json({ error: "Material item could not be reloaded" }, { status: 409 });
    await recordAudit({ actor: user, action: "STOCK_BARCODE_SCANNED", entityType: "StockItem", entityId: item.id, details: { businessId, barcode, result: "incremented", before: legacyAlias.stockItem.onHand, after: item.onHand } });
    return NextResponse.json({ status: "incremented", item });
  }

  const quantity = parsed.data.quantity ?? 1;
  try {
    const item = await prisma.stockItem.create({
      data: {
        businessId,
        barcode,
        name: parsed.data.name ?? barcode,
        unit: parsed.data.unit ?? "each",
        onHand: quantity,
        parLevel: 0,
        supplier: parsed.data.supplier || null,
      },
    });
    await recordAudit({ actor: user, action: "STOCK_BARCODE_SCANNED", entityType: "StockItem", entityId: item.id, details: { businessId, barcode, result: "created", after: item.onHand } });
    return NextResponse.json({ status: "created", item }, { status: 201 });
  } catch {
    // A second scanner may have created the same tenant barcode concurrently.
    const retry = await prisma.stockItem.findFirst({ where: { businessId, barcode } });
    if (!retry) return NextResponse.json({ error: "Could not save barcode" }, { status: 500 });
    await prisma.stockItem.updateMany({ where: { id: retry.id, businessId }, data: { onHand: { increment: 1 } } });
    const item = await prisma.stockItem.findFirst({ where: { id: retry.id, businessId } });
    if (!item) return NextResponse.json({ error: "Material item could not be reloaded" }, { status: 409 });
    await recordAudit({ actor: user, action: "STOCK_BARCODE_SCANNED", entityType: "StockItem", entityId: item.id, details: { businessId, barcode, result: "incremented-after-race", before: retry.onHand, after: item.onHand } });
    return NextResponse.json({ status: "incremented", item });
  }
}
