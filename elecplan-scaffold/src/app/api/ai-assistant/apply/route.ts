import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const proposal=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("event"),title:z.string().trim().min(1).max(120),startsAt:z.string().datetime(),endsAt:z.string().datetime(),notes:z.string().max(2000).optional()}),
 z.object({kind:z.literal("reminder"),title:z.string().trim().min(1).max(200),dueDate:z.string().datetime().optional(),notes:z.string().max(2000).optional()})
]);
const schema=z.object({proposals:z.array(proposal).min(1).max(50)});

export async function POST(req:Request){
 const user=await getSessionUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!canAccess(user.role,"aiAssistant"))return NextResponse.json({error:"Forbidden"},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid assistant proposals",issues:parsed.error.flatten()},{status:400});
 try{
  const created=await prisma.$transaction(async tx=>{
   const out:{kind:string;id:string}[]=[];
   for(const item of parsed.data.proposals){
    if(item.kind==="event"){
     const startsAt=new Date(item.startsAt),endsAt=new Date(item.endsAt);
     if(endsAt<=startsAt)throw new Error("INVALID_EVENT_RANGE");
     const row=await tx.jobEvent.create({data:{title:item.title,notes:item.notes?.trim()||null,type:"other",startsAt,endsAt}});
     out.push({kind:"event",id:row.id});
    }else{
     const dueAt=item.dueDate?new Date(item.dueDate):new Date();
     const row=await tx.reminder.create({data:{userId:user.id,title:item.title,dueAt}});
     out.push({kind:"reminder",id:row.id});
    }
   }
   return out;
  });
  await recordAudit({actor:user,action:"AI_ASSISTANT_APPLIED",entityType:"AiAssistant",details:{created:created.length,items:created}});
  return NextResponse.json({created:created.length,items:created},{status:201});
 }catch{return NextResponse.json({error:"Could not apply assistant changes"},{status:400});}
}
