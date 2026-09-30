import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
const schema=z.object({unitPrice:z.coerce.number().nonnegative().max(10_000_000),quantity:z.coerce.number().positive().max(100000).default(1),gstRate:z.coerce.number().min(0).max(1).default(.1)});
export async function POST(req:Request,{params}:{params:Promise<{id:string;exclusionId:string}>}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!canAccess(user.role,"quotes"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id,exclusionId}=await params;const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a valid price"},{status:400});
 try{
  const extra=await prisma.$transaction(async tx=>{const exclusion=await tx.quoteExclusion.findFirst({where:{id:exclusionId,quoteId:id},include:{quote:{select:{jobId:true}}}});if(!exclusion)return null;if(!exclusion.quote.jobId)throw new Error("NO_JOB");if(exclusion.convertedAt)throw new Error("ALREADY_CONVERTED");const row=await tx.jobExtra.create({data:{jobId:exclusion.quote.jobId,description:exclusion.description,quantity:parsed.data.quantity,unitPrice:parsed.data.unitPrice,gstRate:parsed.data.gstRate,source:"QUOTE_EXCLUSION"}});await tx.quoteExclusion.update({where:{id:exclusion.id},data:{convertedAt:new Date()}});return row});
  if(!extra)return NextResponse.json({error:"Exclusion not found"},{status:404});
  await recordAudit({actor:user,action:"QUOTE_EXCLUSION_TO_EXTRA",entityType:"JobExtra",entityId:extra.id,details:{quoteId:id,exclusionId}});
  return NextResponse.json(extra,{status:201});
 }catch(error){if(error instanceof Error&&error.message==="NO_JOB")return NextResponse.json({error:"Link this quote to a job first"},{status:400});if(error instanceof Error&&error.message==="ALREADY_CONVERTED")return NextResponse.json({error:"This exclusion is already an extra"},{status:409});return NextResponse.json({error:"Could not create extra"},{status:400})}
}