import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, verifyCommitToken } from "@/lib/storage";

const schema = z.object({ name: z.string().trim().min(1).max(200), type: z.string().trim().min(1).max(80), jobId: z.string().trim().min(1).nullable().optional(), commitToken: z.string().min(1) });
const fallbackSchema = schema.omit({ commitToken: true });

export const runtime = "nodejs";

async function context(){
  const user=await getSessionUser();
  if(!user)return{error:NextResponse.json({error:"Unauthorized"},{status:401})}as const;
  if(!canAccess(user.role,"documents"))return{error:NextResponse.json({error:"Forbidden"},{status:403})}as const;
  if(!user.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{user,businessId:user.businessId}as const;
}

export async function GET(){
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const documents=await prisma.document.findMany({
    where:{businessId:ctx.businessId},
    select:{id:true,name:true,type:true,fileUrl:true,storageKey:true,originalName:true,contentType:true,sizeBytes:true,uploadedAt:true,businessId:true,jobId:true,job:{select:{id:true,title:true,status:true}}},
  });
  return NextResponse.json(documents);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;

  if (req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Could not read the document upload" }, { status: 400 });
    const file = form.get("file");
    const parsed = fallbackSchema.safeParse({ name: form.get("name"), type: form.get("type"), jobId: form.get("jobId") || null });
    if (!parsed.success || !(file instanceof File) || file.size <= 0) return NextResponse.json({ error: "Document name, type and file are required" }, { status: 400 });
    if (!DOCUMENT_TYPES.has(file.type)) return NextResponse.json({ error: "Documents must be PDF, PNG, JPEG, WebP or text" }, { status: 400 });
    if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: `File is too large. Maximum is ${Math.floor(DOCUMENT_MAX_BYTES / 1024 / 1024)} MB.` }, { status: 400 });
    const { name, type, jobId = null } = parsed.data;
    if (jobId) {
      const job = await prisma.job.findFirst({ where: { id: jobId, businessId }, select: { id: true } });
      if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 400 });
    }
    const id = randomUUID();
    const document = await prisma.document.create({
      data: { id, businessId, name, type, jobId, fileUrl: `/api/documents/${id}/file`, originalName: file.name.slice(0, 200), contentType: file.type, sizeBytes: file.size, fileData: Buffer.from(await file.arrayBuffer()) },
      select: { id: true, name: true, type: true, jobId: true, fileUrl: true, originalName: true, contentType: true, sizeBytes: true, uploadedAt: true },
    });
    await recordAudit({ actor: user, action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: document.id, details: { businessId, jobId, contentType: file.type, sizeBytes: file.size, storage: "database" } });
    return NextResponse.json(document, { status: 201 });
  }

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
  const document = await prisma.document.create({
    data: { id, businessId, name, type, jobId, fileUrl: `/api/documents/${id}/file`, storageKey: upload.key, originalName: upload.fileName, contentType: upload.contentType, sizeBytes: upload.sizeBytes },
    select: { id: true, name: true, type: true, jobId: true, fileUrl: true, originalName: true, contentType: true, sizeBytes: true, uploadedAt: true },
  });
  await recordAudit({ actor: user, action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: document.id, details: { businessId, jobId, contentType: upload.contentType, sizeBytes: upload.sizeBytes } });
  return NextResponse.json(document, { status: 201 });
}
