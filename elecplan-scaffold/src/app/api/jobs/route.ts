import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const jobSchema = z.object({
  title: z.string().trim().min(1).max(160),
  clientId: z.string().trim().min(1),
  address: z.string().trim().min(1).max(240),
  crewIds: z.array(z.string().trim().min(1)).max(50).default([]),
  status: z.enum(["QUOTED","SCHEDULED","IN_PROGRESS","COMPLETE","INVOICED"]).default("SCHEDULED"),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  if (user.role === "EMPLOYEE") return NextResponse.json({error:"Only admins and supervisors can create jobs"},{status:403});
  const parsed = jobSchema.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid input",issues:parsed.error.flatten()},{status:400});
  const d=parsed.data; const hasStart=Boolean(d.scheduledStart), hasEnd=Boolean(d.scheduledEnd);
  if (hasStart!==hasEnd) return NextResponse.json({error:"Scheduled start and end must be provided together"},{status:400});
  const start=d.scheduledStart?new Date(d.scheduledStart):null, end=d.scheduledEnd?new Date(d.scheduledEnd):null;
  if (start&&end&&end<=start) return NextResponse.json({error:"End time must be after start time"},{status:400});
  const uniqueCrew=[...new Set(d.crewIds)];
  const [client,activeCrew]=await Promise.all([
    prisma.client.findUnique({where:{id:d.clientId},select:{id:true}}),
    uniqueCrew.length?prisma.user.findMany({where:{id:{in:uniqueCrew},active:true},select:{id:true}}):Promise.resolve([]),
  ]);
  if (!client) return NextResponse.json({error:"Client not found"},{status:404});
  if (activeCrew.length!==uniqueCrew.length) return NextResponse.json({error:"One or more assigned workers are inactive or invalid"},{status:400});
  try {
    const primaryId=uniqueCrew[0]??null;
    const job=await prisma.$transaction(async(tx)=>{
      const created=await tx.job.create({data:{title:d.title,clientId:d.clientId,address:d.address,assignedToId:primaryId,crew:{connect:uniqueCrew.map(id=>({id}))},status:d.status,scheduledStart:start,scheduledEnd:end,notes:d.notes||null},include:{client:{select:{name:true}},assignedTo:{select:{name:true}},crew:{select:{id:true,name:true}}}});
      if(start&&end) await tx.jobEvent.create({data:{jobId:created.id,type:"job",startsAt:start,endsAt:end,assignedToId:primaryId}});
      return created;
    });
    await recordAudit({actor:user,action:"JOB_CREATED",entityType:"Job",entityId:job.id,details:{title:job.title,clientId:job.clientId,crewIds:uniqueCrew,status:job.status,scheduled:Boolean(job.scheduledStart&&job.scheduledEnd)}});
    return NextResponse.json(job,{status:201});
  } catch { return NextResponse.json({error:"Could not create job"},{status:400}); }
}
