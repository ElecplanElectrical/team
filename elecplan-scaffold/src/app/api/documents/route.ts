import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({ name: z.string().trim().min(1).max(200), type: z.string().trim().min(1).max(80), jobId: z.string().trim().min(1).nullable().optional(), commitToken: z.string().min(1) });

async function context(){
  const user=await getSessionUser();
  if(!user)return{error:NextResponse.json({error:"Unauthorized"},{status:401})}as const;
  if(!canAccess(user.role,"documents"))return{error:NextResponse.json({error:"Forbidden"},{status:403})}as const;
  const dbUser=await prisma.user.findUnique({where:{id:user.id},select:{businessId:true,active:true}});
  if(!dbUser?.active||!dbUser.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{user,businessId:dbUser.businessId}as const;
}

export async function GET(){
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const documents=await prisma.document.findMany({
    where:{businessId:ctx.businessId},
    include:{job:{select:{id:true,title:true,status:true}}},
    orderBy:{createdAt:"desc"},
  });
  return NextResponse.json(documents);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Document name, type and completed private upload are required" }, { status: 400 });
  const { name, type, jobId = null, commitToken } = parsed.data;
  const upload = verifyCommitToken(commitToken, "documents");
  if (!upload) return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });

  if (jobId) {
    const job = await prisma.job.findFirst({ where: { id: jobId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 400 });
  }

  const id = randomUUID();
  const document = await prisma.document.create({ data: { id, businessId, name, type, jobId, fileUrl: `/api/documents/${id}/file`, storageKey: upload.key, originalName: upload.fileName, contentType: upload.contentType, sizeBytes: upload.sizeBytes } });
  await recordAudit({ actor: user, action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: document.id, details: { businessId, jobId, contentType: upload.contentType, sizeBytes: upload.sizeBytes } });
  return NextResponse.json(document, { status: 201 });
}
