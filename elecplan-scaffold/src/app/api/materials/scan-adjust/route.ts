import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

export async function POST(req:Request){
  await requireAccess("materials");
  const body=await req.json().catch(()=>({}));
  const itemId=String(body.itemId??"").trim();
  const delta=Math.trunc(Number(body.delta)||0);
  if(!itemId)return NextResponse.json({error:"Item is required"},{status:400});
  if(!delta||Math.abs(delta)>9999)return NextResponse.json({error:"Invalid adjustment"},{status:400});
  const existing=await prisma.stockItem.findUnique({where:{id:itemId},select:{onHand:true}});
  if(!existing)return NextResponse.json({error:"Item not found"},{status:404});
  const next=Math.max(0,existing.onHand+delta);
  const item=await prisma.stockItem.update({where:{id:itemId},data:{onHand:next}});
  return NextResponse.json({item,delta:next-existing.onHand});
}
