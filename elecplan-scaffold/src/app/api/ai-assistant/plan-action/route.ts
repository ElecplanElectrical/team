import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

type PlannedAction =
  | { action:"ADD_JOB_TASK"; jobId:string; title:string; label:string; detail:string }
  | { action:"USE_MATERIAL"; jobId:string; materialId:string; quantity:number; label:string; detail:string }
  | { action:"COMPLETE_JOB"; jobId:string; notes?:string; label:string; detail:string }
  | { action:"SEND_CONFIRMATION"; jobId:string; label:string; detail:string }
  | { action:"INVOICE_ACCEPTED_QUOTE"; quoteId:string; label:string; detail:string };

const normalise=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

function score(haystack:string,needle:string){
  const a=normalise(haystack),b=normalise(needle);
  if(!a||!b)return 0;
  if(a===b)return 100;
  if(a.includes(b)||b.includes(a))return 80;
  const tokens=b.split(" ").filter(x=>x.length>2);
  return tokens.reduce((n,t)=>n+(a.includes(t)?10:0),0);
}

export async function POST(req:Request){
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!canAccess(user.role,"aiAssistant")||user.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
  const body=await req.json().catch(()=>null) as {instruction?:string}|null;
  const instruction=body?.instruction?.trim().slice(0,1000)||"";
  if(!instruction)return NextResponse.json({planned:[]});

  const [jobs,materials,quotes]=await Promise.all([
    prisma.job.findMany({
      where:{status:{in:["QUOTED","SCHEDULED","IN_PROGRESS","COMPLETE"]}},
      include:{client:{select:{name:true}}},
      orderBy:{createdAt:"desc"},take:200
    }),
    prisma.material.findMany({orderBy:{name:"asc"},take:500}),
    prisma.quote.findMany({
      where:{status:"ACCEPTED"},
      include:{client:{select:{name:true}},job:{select:{title:true}},convertedInvoice:{select:{id:true}}},
      orderBy:{createdAt:"desc"},take:100
    }),
  ]);

  const findJob=(hint:string)=>{
    const ranked=jobs.map(j=>({j,s:Math.max(score(j.title,hint),score(j.client.name,hint),score(j.address,hint))})).sort((a,b)=>b.s-a.s);
    return ranked[0]?.s>=20?ranked[0].j:null;
  };
  const findMaterial=(hint:string)=>{
    const ranked=materials.map(m=>({m,s:Math.max(score(m.name,hint),score(m.sku||"",hint),score(m.barcode||"",hint),score(m.supplierSku||"",hint))})).sort((a,b)=>b.s-a.s);
    return ranked[0]?.s>=20?ranked[0].m:null;
  };

  const planned:PlannedAction[]=[];

  const use=instruction.match(/\b(?:used|use|add)\s+(\d+(?:\.\d+)?)\s+(.+?)\s+(?:on|for|to)\s+(?:the\s+)?(?:job\s+)?(.+)$/i);
  if(use&&/\b(?:used|use)\b/i.test(instruction)){
    const qty=Number(use[1]),material=findMaterial(use[2]),job=findJob(use[3]);
    if(job&&material&&qty>0){
      planned.push({action:"USE_MATERIAL",jobId:job.id,materialId:material.id,quantity:qty,label:`Use ${qty} × ${material.name}`,detail:`${job.title} · stock now ${material.stockOnHand} ${material.unit||""}`.trim()});
      return NextResponse.json({summary:"I found the job and material. Review the stock deduction before applying.",planned});
    }
  }

  const complete=instruction.match(/\b(?:complete|finish|mark)\s+(?:the\s+)?(?:job\s+)?(.+?)(?:\s+complete)?$/i);
  if(complete){
    const job=findJob(complete[1]);
    if(job){
      planned.push({action:"COMPLETE_JOB",jobId:job.id,label:"Mark job complete",detail:`${job.title} · ${job.client.name}`});
      return NextResponse.json({summary:"Review the job status change before applying.",planned});
    }
  }

  const confirm=instruction.match(/\b(?:send|text|sms)\b[\s\S]*\bconfirmation\b[\s\S]*?(?:for|to)\s+(?:the\s+)?(?:job\s+)?(.+)$/i);
  if(confirm){
    const job=findJob(confirm[1]);
    if(job){
      planned.push({action:"SEND_CONFIRMATION",jobId:job.id,label:"Send booking confirmation SMS",detail:`${job.title} · ${job.client.name}`});
      return NextResponse.json({summary:"Review the client-facing SMS before sending.",planned});
    }
  }

  const task=instruction.match(/\b(?:add|create)\s+(?:a\s+)?(?:task|checklist item)\s+(.+?)\s+(?:to|for|on)\s+(?:the\s+)?(?:job\s+)?(.+)$/i);
  if(task){
    const job=findJob(task[2]);
    if(job){
      planned.push({action:"ADD_JOB_TASK",jobId:job.id,title:task[1].trim(),label:"Add job task",detail:`${task[1].trim()} · ${job.title}`});
      return NextResponse.json({summary:"Review the checklist item before applying.",planned});
    }
  }

  if(/\b(invoice|create invoice|send invoice)\b/i.test(instruction)){
    const ranked=quotes.filter(q=>!q.convertedInvoice).map(q=>({q,s:Math.max(score(q.quoteNumber||"",instruction),score(q.client.name,instruction),score(q.job?.title||"",instruction))})).sort((a,b)=>b.s-a.s);
    if(ranked[0]?.s>=20){
      const q=ranked[0].q;
      planned.push({action:"INVOICE_ACCEPTED_QUOTE",quoteId:q.id,label:"Create invoice from accepted quote",detail:`${q.quoteNumber||"Accepted quote"} · ${q.client.name} · $${Number(q.amount).toFixed(2)}`});
      return NextResponse.json({summary:"This creates the Elecplan invoice record. It does not write to Xero yet.",planned});
    }
  }

  return NextResponse.json({
    summary:"I could not identify a safe portal action from that command. Try naming the job and the action, for example “use 4 Clipsal double GPOs on Smith job” or “send confirmation for Smith job”.",
    planned:[]
  });
}
