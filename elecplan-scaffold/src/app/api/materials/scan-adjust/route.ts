import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

export async function POST(req: Request) {
  await requireAccess("materials");
  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId ?? "").trim();
  const delta = Math.trunc(Number(body.delta) || 0);
  if (!itemId) return NextResponse.json({ error: "Item is required" }, { status: 400 });
  if (!delta || Math.abs(delta) > 9999) return NextResponse.json({ error: "Invalid adjustment" }, { status: 400 });

  const existing = await prisma.material.findUnique({ where: { id: itemId }, select: { stockOnHand: true } });
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const before = Number(existing.stockOnHand);
  const next = Math.max(0, before + delta);
  const item = await prisma.material.update({ where: { id: itemId }, data: { stockOnHand: next } });
  return NextResponse.json({ item, delta: next - before });
}
