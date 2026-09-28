import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const schema=z.object({commitToken:z.string().min(1),fileName:z.string().trim().min(1).max(200),kind:z.enum(["photo","document"])});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!canAccess(user.role,"projects"))return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;const project=await prisma.project.findUnique({where:{id},select:{id:true,jobId:true}});
 if(!project)return NextResponse.json({error:"Past project not found"},{status:404});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Completed upload is required"},{status:400});
 const {commitToken,fileName,kind}=parsed.data;
 if(kind==="photo"){
  const upload=verifyCommitToken(commitToken,"project-photos");if(!upload)return NextResponse.json({error:"Upload ticket is invalid or expired"},{status:400});
  const photoId=randomUUID();const photo=await prisma.projectPhoto.create({data:{id:photoId,projectId:id,jobId:project.jobId,url:`/api/projects/${photoId}/file`,storageKey:upload.key,mimeType:upload.contentType,sizeBytes:upload.sizeBytes}});
  await recordAudit({actor:user,action:"PROJECT_PHOTO_UPLOADED",entityType:"ProjectPhoto",entityId:photo.id,details:{projectId:id}});
  return NextResponse.json(photo,{status:201});
 }
 const upload=verifyCommitToken(commitToken,"documents");if(!upload)return NextResponse.json({error:"Upload ticket is invalid or expired"},{status:400});
 const documentId=randomUUID();const document=await prisma.document.create({data:{id:documentId,name:fileName,url:`/api/documents/${documentId}/file`,storageKey:upload.key,mimeType:upload.contentType,sizeBytes:upload.sizeBytes,kind:"Past project",projectId:id,jobId:project.jobId}});
 await recordAudit({actor:user,action:"PROJECT_DOCUMENT_UPLOADED",entityType:"Document",entityId:document.id,details:{projectId:id}});
 return NextResponse.json(document,{status:201});
}