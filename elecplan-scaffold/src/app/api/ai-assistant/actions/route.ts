import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { sendSms, smsConfigured } from "@/lib/sms";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ADD_JOB_TASK"), jobId: z.string().min(1), title: z.string().trim().min(1).max(160) }),
  z.object({ action: z.literal("USE_MATERIAL"), jobId: z.string().min(1), materialId: z.string().min(1), quantity: z.coerce.number().positive().max(10000) }),
  z.object({ action: z.literal("COMPLETE_JOB"), jobId: z.string().min(1), notes: z.string().trim().max(1500).optional() }),
  z.object({ action: z.literal("SEND_CONFIRMATION"), jobId: z.string().min(1) }),
  z.object({ action: z.literal("INVOICE_ACCEPTED_QUOTE"), quoteId: z.string().min(1) }),
]);

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
function normalizeAustralianMobile(value: string): string | null {
  let n=value.trim().replace(/[^\d+]/g,"");
  if(n.startsWith("0061"))n=`+61${n.slice(4)}`; else if(n.startsWith("61"))n=`+${n}`; else if(n.startsWith("04"))n=`+61${n.slice(1)}`;
  return /^\+614\d{8}$/.test(n)?n:null;
}
function bookingTime(date:Date){return new Intl.DateTimeFormat("en-AU",{timeZone:"Australia/Melbourne",weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit",hour12:true}).format(date)}

export async function POST(req:Request){
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!canAccess(user.role,"aiAssistant")||user.role!=="ADMIN")return NextResponse.json({error:"Only the Elecplan admin can run assistant actions"},{status:403});
  const p=schema.safeParse(await req.json().catch(()=>null));
  if(!p.success)return NextResponse.json({error:p.error.issues[0]?.message||"Invalid assistant action"},{status:400});
  const d=p.data;

  if(d.action==="ADD_JOB_TASK"){
    const job=await prisma.job.findUnique({where:{id:d.jobId},select:{id:true,title:true}});
    if(!job)return NextResponse.json({error:"Job not found"},{status:404});
    const task=await prisma.jobTask.create({data:{jobId:job.id,title:d.title}});
    await recordAudit({actor:user,action:"AI_JOB_TASK_CREATED",entityType:"Job",entityId:job.id,details:{taskId:task.id,title:d.title}});
    return NextResponse.json({ok:true,result:task});
  }

  if(d.action==="USE_MATERIAL"){
    const [job,material]=await Promise.all([
      prisma.job.findUnique({where:{id:d.jobId},select:{id:true,title:true}}),
      prisma.material.findUnique({where:{id:d.materialId},select:{id:true,name:true,unit:true,stockOnHand:true}}),
    ]);
    if(!job)return NextResponse.json({error:"Job not found"},{status:404});
    if(!material)return NextResponse.json({error:"Material not found"},{status:404});
    const before=Number(material.stockOnHand);
    if(before<d.quantity)return NextResponse.json({error:`Only ${before} ${material.unit||"units"} of ${material.name} are in stock`},{status:409});
    const used=await prisma.$transaction(async tx=>{
      const row=await tx.jobMaterial.create({data:{jobId:job.id,materialId:material.id,name:material.name,quantity:d.quantity,unit:material.unit}});
      await tx.material.update({where:{id:material.id},data:{stockOnHand:{decrement:d.quantity}}});
      return row;
    });
    await recordAudit({actor:user,action:"AI_JOB_MATERIAL_USED",entityType:"Job",entityId:job.id,details:{jobMaterialId:used.id,materialId:material.id,name:material.name,quantity:d.quantity,stockBefore:before,stockAfter:before-d.quantity}});
    return NextResponse.json({ok:true,result:used});
  }

  if(d.action==="COMPLETE_JOB"){
    const job=await prisma.job.findUnique({where:{id:d.jobId},select:{id:true,title:true,status:true,notes:true}});
    if(!job)return NextResponse.json({error:"Job not found"},{status:404});
    if(job.status==="INVOICED")return NextResponse.json({error:"An invoiced job cannot be completed again"},{status:409});
    const updated=await prisma.job.update({where:{id:job.id},data:{status:"COMPLETE",notes:d.notes?(job.notes?`${job.notes}\n\nCompletion: ${d.notes}`:`Completion: ${d.notes}`):job.notes}});
    await recordAudit({actor:user,action:"AI_JOB_COMPLETED",entityType:"Job",entityId:job.id,details:{notes:d.notes||null}});
    return NextResponse.json({ok:true,result:updated});
  }

  if(d.action==="SEND_CONFIRMATION"){
    if(!smsConfigured())return NextResponse.json({error:"SMS is not configured"},{status:503});
    const job=await prisma.job.findUnique({where:{id:d.jobId},include:{client:{select:{name:true,contactName:true,phone:true}}}});
    if(!job)return NextResponse.json({error:"Job not found"},{status:404});
    if(!job.scheduledStart)return NextResponse.json({error:"Schedule the job before sending a confirmation"},{status:400});
    const to=job.client.phone?normalizeAustralianMobile(job.client.phone):null;
    if(!to)return NextResponse.json({error:"Client does not have a valid Australian mobile"},{status:400});
    const first=(job.client.contactName||job.client.name).trim().split(/\s+/)[0]||"there";
    const message=`Hi ${first}, your booking with Elecplan Pty Ltd is confirmed for ${bookingTime(job.scheduledStart)} at ${job.address}. If your plans change or you need to reschedule, please get in touch with us as soon as possible. Thanks, Elecplan.`;
    const sent=await sendSms(to,message);
    const log=await prisma.smsLog.create({data:{jobId:job.id,to,message,status:"SENT",providerId:sent.providerId}});
    await recordAudit({actor:user,action:"AI_CLIENT_CONFIRMATION_SMS_SENT",entityType:"Job",entityId:job.id,details:{smsLogId:log.id}});
    return NextResponse.json({ok:true,to});
  }

  const quote=await prisma.quote.findUnique({where:{id:d.quoteId},include:{lineItems:true,convertedInvoice:{select:{id:true,invoiceNumber:true}}}});
  if(!quote)return NextResponse.json({error:"Quote not found"},{status:404});
  if(quote.status!=="ACCEPTED")return NextResponse.json({error:"Only an accepted quote can be invoiced"},{status:400});
  if(quote.convertedInvoice)return NextResponse.json({error:"This quote already has an invoice",invoice:quote.convertedInvoice},{status:409});
  const dueDate=new Date();dueDate.setDate(dueDate.getDate()+14);
  const invoice=await prisma.$transaction(async tx=>{
    const created=await tx.invoice.create({data:{invoiceNumber:invoiceNumber(),sourceQuoteId:quote.id,clientId:quote.clientId,jobId:quote.jobId,subtotal:quote.subtotal??quote.amount,gstAmount:quote.gstAmount??0,amount:quote.amount,dueDate,status:"UNPAID",lineItems:quote.lineItems.length?{create:quote.lineItems.map(i=>({description:i.description,quantity:i.quantity,unitPrice:i.unitPrice,lineTotal:i.lineTotal,gstRate:i.gstRate}))}:undefined},select:{id:true,invoiceNumber:true,amount:true,dueDate:true}});
    if(quote.jobId)await tx.job.updateMany({where:{id:quote.jobId,status:"COMPLETE"},data:{status:"INVOICED"}});
    return created;
  });
  await recordAudit({actor:user,action:"AI_QUOTE_CONVERTED_TO_INVOICE",entityType:"Quote",entityId:quote.id,details:{invoiceId:invoice.id,invoiceNumber:invoice.invoiceNumber,jobId:quote.jobId,amount:Number(quote.amount)}});
  return NextResponse.json({ok:true,result:invoice});
}
