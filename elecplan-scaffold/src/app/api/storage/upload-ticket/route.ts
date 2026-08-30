import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccess } from "@/lib/access";
import { getSessionUser } from "@/lib/session";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import { createUploadTicket, DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, PHOTO_MAX_BYTES, PHOTO_TYPES, storageConfigured } from "@/lib/storage";

const schema=z.object({kind:z.enum(["documents","project-photos","equipment-photos","material-photos"]),fileName:z.string().trim().min(1).max(200),contentType:z.string().trim().min(1).max(100),sizeBytes:z.number().int().positive()});
export async function POST(req:Request){
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid upload request"},{status:400});
  const{kind,fileName,contentType,sizeBytes}=parsed.data;
  const actor=await prisma.user.findUnique({where:{id:user.id},select:{active:true,businessId:true}});
  if(!actor?.active)return NextResponse.json({error:"Inactive account"},{status:403});

  if(!actor.businessId){
    const platformAdmin=await getPlatformAdmin();
    if(!platformAdmin||kind!=="documents")return NextResponse.json({error:"No active customer business selected."},{status:409});
    if(!PHOTO_TYPES.has(contentType))return NextResponse.json({error:"Platform branding uploads must be PNG, JPEG or WebP"},{status:400});
    if(sizeBytes>PHOTO_MAX_BYTES)return NextResponse.json({error:`File is too large. Maximum is ${Math.floor(PHOTO_MAX_BYTES/1024/1024)} MB.`},{status:400});
    if(!storageConfigured())return NextResponse.json({error:"Private storage is not configured yet"},{status:503});
    return NextResponse.json(createUploadTicket({kind,fileName,contentType,sizeBytes}));
  }

  if(kind==="documents"&&(!canAccess(user.role,"documents")||!user.business?.modules.includes("documents")))return NextResponse.json({error:"Documents module is disabled or unavailable"},{status:403});
  if(kind==="material-photos"&&(!canAccess(user.role,"materials")||!user.business?.modules.includes("materials")))return NextResponse.json({error:"Materials module is disabled or unavailable"},{status:403});
  if(kind==="project-photos"&&!canAccess(user.role,"projects"))return NextResponse.json({error:"Forbidden"},{status:403});
  if(kind==="equipment-photos"&&!canAccess(user.role,"equipment"))return NextResponse.json({error:"Forbidden"},{status:403});
  const isDocument=kind==="documents";
  const allowedTypes=isDocument?DOCUMENT_TYPES:PHOTO_TYPES;
  const maxBytes=isDocument?DOCUMENT_MAX_BYTES:PHOTO_MAX_BYTES;
  if(!allowedTypes.has(contentType))return NextResponse.json({error:"This file type is not allowed"},{status:400});
  if(sizeBytes>maxBytes)return NextResponse.json({error:`File is too large. Maximum is ${Math.floor(maxBytes/1024/1024)} MB.`},{status:400});
  if(!storageConfigured())return NextResponse.json({error:"Private storage is not configured yet"},{status:503});
  return NextResponse.json(createUploadTicket({kind,fileName,contentType,sizeBytes}));
}
