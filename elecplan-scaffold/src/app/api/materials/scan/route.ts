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
async function logScan(itemId: string, barcode: string, quantity: number, before: number, after: number, sessionId: string | null, status: string) {
  await prisma.auditLog.create({ data: { action: "STOCK_SCAN", entityType: "Material", entityId: itemId, details: { barcode, quantity, before, after, sessionId, status } } });
}

export async function GET(req: Request) {
  await requireAccess("materials");
  const barcode = cleanBarcode(new URL(req.url).searchParams.get("barcode"));
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  const item = await prisma.material.findFirst({ where: { barcode } });
  return NextResponse.json({ barcode, known: Boolean(item), item });
}

export async function PATCH(req: Request) {
  await requireAccess("materials");
  const body = await req.json().catch(() => ({}));
  const barcode = cleanBarcode(body.barcode);
  const name = String(body.name ?? "").trim().slice(0, 160);
  if (!barcode || !name) return NextResponse.json({ error: "Barcode and item name are required" }, { status: 400 });

  const item = await prisma.material.findFirst({ where: { barcode } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const updated = await prisma.material.update({ where: { id: item.id }, data: { name } });
  await prisma.auditLog.create({ data: { action: "STOCK_ITEM_RENAMED_FROM_SCANNER", entityType: "Material", entityId: updated.id, details: { barcode, name } } });
  return NextResponse.json({ ok: true, item: updated });
}

export async function POST(req: Request) {
  await requireAccess("materials");
  const body = await req.json().catch(() => ({}));
  const barcode = cleanBarcode(body.barcode);
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const quantity = cleanQty(body.quantity);
  const sessionId = cleanSession(body.sessionId);
  const found = await prisma.material.findFirst({ where: { barcode } });

  if (found) {
    const before = Number(found.stockOnHand);
    const item = await prisma.material.update({ where: { id: found.id }, data: { stockOnHand: { increment: quantity } } });
    const after = Number(item.stockOnHand);
    await logScan(item.id, barcode, quantity, before, after, sessionId, "incremented");
    return NextResponse.json({ status: "incremented", added: quantity, item });
  }

  const name = String(body.name ?? "").trim().slice(0, 160);
  if (!name) return NextResponse.json({ error: "Select the item name on the label first" }, { status: 409 });
  const unit = String(body.unit ?? "each").trim().slice(0, 40) || "each";
  const supplier = String(body.supplier ?? "").trim().slice(0, 100) || null;

  try {
    const item = await prisma.material.create({ data: { name, unit, stockOnHand: quantity, reorderPoint: 0, supplier, barcode } });
    await logScan(item.id, barcode, quantity, 0, Number(item.stockOnHand), sessionId, "created");
    return NextResponse.json({ status: "created", added: quantity, item }, { status: 201 });
  } catch {
    const retry = await prisma.material.findFirst({ where: { barcode } });
    if (retry) {
      const before = Number(retry.stockOnHand);
      const item = await prisma.material.update({ where: { id: retry.id }, data: { stockOnHand: { increment: quantity } } });
      await logScan(item.id, barcode, quantity, before, Number(item.stockOnHand), sessionId, "incremented");
      return NextResponse.json({ status: "incremented", added: quantity, item });
    }
    return NextResponse.json({ error: "Could not save barcode" }, { status: 500 });
  }
}
