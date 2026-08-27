import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

function cleanBarcode(value: unknown) {
  return String(value ?? "").replace(/[^0-9A-Za-z-]/g, "").slice(0, 64);
}
function cleanQty(value: unknown) {
  const n = Math.floor(Number(value) || 1);
  return Math.max(1, Math.min(9999, n));
}
function cleanSession(value: unknown) {
  return String(value ?? "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 80) || null;
}
function cleanLabelText(value: unknown) {
  return String(value ?? "").trim().slice(0, 120) || null;
}

async function getRule(barcode: string) {
  const row = await prisma.auditLog.findFirst({
    where: { action: "STOCK_SCAN_RULE", entityType: "StockBarcode", entityId: barcode },
    orderBy: { createdAt: "desc" },
    select: { details: true, createdAt: true },
  });
  const details = (row?.details ?? {}) as Record<string, unknown>;
  const quantity = Number(details.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return {
    quantity: Math.max(1, Math.min(9999, Math.floor(quantity))),
    labelText: typeof details.labelText === "string" ? details.labelText : null,
    learnedAt: row?.createdAt ?? null,
  };
}

async function saveRule(barcode: string, quantity: number, labelText: string | null) {
  await prisma.auditLog.create({
    data: {
      action: "STOCK_SCAN_RULE",
      entityType: "StockBarcode",
      entityId: barcode,
      details: { barcode, quantity, labelText },
    },
  });
}

async function logScan(itemId: string, barcode: string, quantity: number, before: number, after: number, sessionId: string | null, status: string) {
  await prisma.auditLog.create({
    data: {
      action: "STOCK_SCAN",
      entityType: "StockItem",
      entityId: itemId,
      details: { barcode, quantity, before, after, sessionId, status },
    },
  });
}

export async function GET(req: Request) {
  await requireAccess("materials");
  const barcode = cleanBarcode(new URL(req.url).searchParams.get("barcode"));
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const [rule, alias, found] = await Promise.all([
    getRule(barcode),
    prisma.stockBarcode.findUnique({ where: { barcode }, include: { stockItem: true } }),
    prisma.stockItem.findUnique({ where: { barcode } }),
  ]);
  const item = alias?.stockItem ?? found ?? null;
  return NextResponse.json({
    barcode,
    known: Boolean(item),
    item,
    learnedQuantity: rule?.quantity ?? null,
    learnedLabelText: rule?.labelText ?? null,
  });
}

export async function POST(req: Request) {
  await requireAccess("materials");
  const body = await req.json().catch(() => ({}));
  const barcode = cleanBarcode(body.barcode);
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const learned = await getRule(barcode);
  const quantity = body.quantity == null && learned ? learned.quantity : cleanQty(body.quantity);
  const sessionId = cleanSession(body.sessionId);
  const learnRule = body.learnRule === true;
  const labelText = cleanLabelText(body.labelText);

  const finish = async (item: any, status: string, before: number, httpStatus = 200) => {
    await logScan(item.id, barcode, quantity, before, item.onHand, sessionId, status);
    if (learnRule) await saveRule(barcode, quantity, labelText);
    return NextResponse.json({ status, added: quantity, item, learnedQuantity: quantity, learnedLabelText: labelText }, { status: httpStatus });
  };

  const alias = await prisma.stockBarcode.findUnique({ where: { barcode }, include: { stockItem: true } });
  if (alias) {
    const before = alias.stockItem.onHand;
    const item = await prisma.stockItem.update({ where: { id: alias.stockItemId }, data: { onHand: { increment: quantity } } });
    return finish(item, "incremented", before);
  }

  const found = await prisma.stockItem.findUnique({ where: { barcode } });
  if (found) {
    await prisma.stockBarcode.upsert({ where: { barcode }, create: { barcode, stockItemId: found.id }, update: { stockItemId: found.id } });
    const before = found.onHand;
    const item = await prisma.stockItem.update({ where: { id: found.id }, data: { onHand: { increment: quantity } } });
    return finish(item, "incremented", before);
  }

  const name = String(body.name ?? barcode).trim().slice(0, 160) || barcode;
  const unit = String(body.unit ?? "each").trim().slice(0, 40) || "each";
  const supplier = String(body.supplier ?? "").trim().slice(0, 100) || null;

  try {
    const item = await prisma.stockItem.create({
      data: { name, unit, onHand: quantity, parLevel: 0, supplier, barcode, barcodes: { create: { barcode } } },
    });
    return finish(item, "created", 0, 201);
  } catch {
    const retry = await prisma.stockBarcode.findUnique({ where: { barcode }, include: { stockItem: true } });
    if (retry) {
      const before = retry.stockItem.onHand;
      const item = await prisma.stockItem.update({ where: { id: retry.stockItemId }, data: { onHand: { increment: quantity } } });
      return finish(item, "incremented", before);
    }
    return NextResponse.json({ error: "Could not save barcode" }, { status: 500 });
  }
}
