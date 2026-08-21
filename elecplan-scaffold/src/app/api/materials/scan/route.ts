import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

function cleanBarcode(value: unknown) {
  return String(value ?? "").replace(/[^0-9A-Za-z]/g, "").slice(0, 64);
}

export async function POST(req: Request) {
  await requireAccess("materials");
  const body = await req.json().catch(() => ({}));
  const barcode = cleanBarcode(body.barcode);
  if (!barcode) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const found = await prisma.$queryRaw<Array<{id:string;name:string;unit:string;onHand:number;parLevel:number;supplier:string|null;barcode:string|null}>>`
    SELECT "id","name","unit","onHand","parLevel","supplier","barcode"
    FROM "StockItem" WHERE "barcode" = ${barcode} LIMIT 1
  `;
  const item = found[0];

  if (item) {
    const rows = await prisma.$queryRaw<Array<{id:string;name:string;unit:string;onHand:number;parLevel:number;supplier:string|null;barcode:string|null}>>`
      UPDATE "StockItem" SET "onHand" = "onHand" + 1
      WHERE "id" = ${item.id}
      RETURNING "id","name","unit","onHand","parLevel","supplier","barcode"
    `;
    return NextResponse.json({ status: "incremented", item: rows[0] });
  }

  const name = String(body.name ?? "").trim().slice(0, 160);
  if (!name) return NextResponse.json({ status: "unknown", barcode });
  const unit = String(body.unit ?? "each").trim().slice(0, 40) || "each";
  const supplier = String(body.supplier ?? "").trim().slice(0, 100) || null;
  const quantity = Math.max(1, Math.min(9999, Number(body.quantity) || 1));

  const duplicateName = await prisma.stockItem.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (duplicateName) {
    await prisma.$executeRaw`UPDATE "StockItem" SET "barcode" = COALESCE("barcode", ${barcode}), "onHand" = "onHand" + ${quantity} WHERE "id" = ${duplicateName.id}`;
    return NextResponse.json({ status: "matched-name", item: { ...duplicateName, onHand: duplicateName.onHand + quantity, barcode } });
  }

  const id = `cmat_${crypto.randomUUID().replace(/-/g, "")}`;
  const rows = await prisma.$queryRaw<Array<{id:string;name:string;unit:string;onHand:number;parLevel:number;supplier:string|null;barcode:string|null}>>`
    INSERT INTO "StockItem" ("id","name","unit","onHand","parLevel","supplier","barcode")
    VALUES (${id},${name},${unit},${quantity},0,${supplier},${barcode})
    RETURNING "id","name","unit","onHand","parLevel","supplier","barcode"
  `;
  return NextResponse.json({ status: "created", item: rows[0] }, { status: 201 });
}
