import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({ onHand: z.number().int().min(0) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const { id } = await params;
  try {
    const item = await prisma.stockItem.update({ where: { id }, data: { onHand: parsed.data.onHand } });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
  }
}
