import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const lineItemSchema = z.object({ description: z.string().trim().min(1).max(240), quantity: z.coerce.number().positive().max(100000), unitPrice: z.coerce.number().nonnegative().max(10_000_000), gstRate: z.coerce.number().min(0).max(1).default(0.1) });
const quoteSchema = z.object({ clientId: z.string().trim().min(1), jobId: z.string().trim().optional().nullable(), lineItems: z.array(lineItemSchema).min(1).max(100), status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED"]).default("DRAFT") });
function quoteNumber(){return `QT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`}

export async function POST(req:Request){
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!canAccess(user.role,"quotes"))return NextResponse.json({error:"Forbidden"},{status:403});
  if(!user.businessId)return NextResponse.json({error:"Select a customer business before creating quote data."},{status:409});
  const businessId=user.businessId;
  const parsed=quoteSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid quote details"},{status:400});
  const d=parsed.data;
  const client=await prisma.client.findFirst({where:{id:d.clientId,businessId},select:{id:true}});
  if(!client)return NextResponse.json({error:"Client not found for this business"},{status:404});
  if(d.jobId){const job=await prisma.job.findFirst({where:{id:d.jobId,clientId:d.clientId,businessId},select:{id:true}});if(!job)return NextResponse.json({error:"Selected job does not belong to this business and client"},{status:400});}
  const calculated=d.lineItems.map(item=>({...item,lineTotal:item.quantity*item.unitPrice}));
  const subtotal=calculated.reduce((sum,item)=>sum+item.lineTotal,0);
  const gstAmount=calculated.reduce((sum,item)=>sum+item.lineTotal*item.gstRate,0);
  const amount=subtotal+gstAmount;
  try{
    const quote=await prisma.quote.create({data:{businessId,quoteNumber:quoteNumber(),clientId:d.clientId,jobId:d.jobId||null,subtotal,gstAmount,amount,status:d.status,lineItems:{create:calculated.map(item=>({description:item.description,quantity:item.quantity,unitPrice:item.unitPrice,lineTotal:item.lineTotal,gstRate:item.gstRate}))}},include:{client:{select:{name:true}},job:{select:{title:true}},lineItems:true}});
    return NextResponse.json(quote,{status:201});
  }catch{return NextResponse.json({error:"Could not create quote"},{status:400});}
}
