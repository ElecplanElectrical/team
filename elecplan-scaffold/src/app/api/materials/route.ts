import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(40),
  onHand: z.number().int().min(0),
  parLevel: z.number().int().min(0),
  supplier: z.string().trim().max(120).optional().nullable(),
});

async function context(){
  const user=await getSessionUser();
  if(!user)return{error:NextResponse.json({error:"Unauthorized"},{status:401})}as const;
  if(!user.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{user,businessId:user.businessId}as const;
}

export async function GET(){
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const items=await prisma.stockItem.findMany({where:{businessId:ctx.businessId},orderBy:{name:"asc"}});
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid material item", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const item = await prisma.stockItem.create({ data: { businessId, name: parsed.data.name, unit: parsed.data.unit, onHand: parsed.data.onHand, parLevel: parsed.data.parLevel, supplier: parsed.data.supplier || null } });
    await recordAudit({ actor: user, action: "STOCK_ITEM_CREATED", entityType: "StockItem", entityId: item.id, details: { businessId, name: item.name, unit: item.unit, onHand: item.onHand, parLevel: item.parLevel, hasSupplier: Boolean(item.supplier) } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create material item" }, { status: 400 });
  }
}
