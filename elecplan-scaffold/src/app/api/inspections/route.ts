import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ jobId: z.string().cuid(), type: z.string().trim().min(1).max(120), date: z.string().datetime(), status: z.enum(["SCHEDULED", "PASSED", "FAILED"]) });

async function context(){
  const user=await getSessionUser();
  if(!user)return{error:NextResponse.json({error:"Unauthorized"},{status:401})}as const;
  const dbUser=await prisma.user.findUnique({where:{id:user.id},select:{businessId:true,active:true}});
  if(!dbUser?.active||!dbUser.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{user,businessId:dbUser.businessId}as const;
}

export async function GET(){
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const inspections=await prisma.inspection.findMany({
    where:{job:{businessId:ctx.businessId}},
    include:{job:{select:{id:true,title:true,status:true,client:{select:{id:true,name:true}}}}},
    orderBy:[{date:"desc"}],
  });
  return NextResponse.json(inspections);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can manage inspections" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid inspection details", issues: parsed.error.flatten() }, { status: 400 });
  const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, businessId }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Linked job not found for this business" }, { status: 404 });

  try {
    const inspection = await prisma.inspection.create({ data: { jobId: parsed.data.jobId, type: parsed.data.type, date: new Date(parsed.data.date), status: parsed.data.status } });
    await recordAudit({ actor: user, action: "INSPECTION_CREATED", entityType: "Inspection", entityId: inspection.id, details: { businessId, jobId: inspection.jobId, type: inspection.type, date: inspection.date.toISOString().slice(0, 10), status: inspection.status } });
    return NextResponse.json(inspection, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create inspection. Check the linked job." }, { status: 400 });
  }
}
