import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  onHand: z.number().int().min(0),
  parLevel: z.number().int().min(0),
  supplier: z.string().trim().max(120).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid stock item", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const item = await prisma.stockItem.create({
      data: {
        name: parsed.data.name,
        unit: parsed.data.unit,
        onHand: parsed.data.onHand,
        parLevel: parsed.data.parLevel,
        supplier: parsed.data.supplier || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create stock item" }, { status: 400 });
  }
}
