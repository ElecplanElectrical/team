import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, canManageUser } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

async function targetFor(actorBusinessId:string,id:string){
 return prisma.user.findFirst({where:{id,businessId:actorBusinessId},select:{id:true,role:true,name:true}});
}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const actor=await getSessionUser("employees");
 if(!actor||!actor.businessId||!canAccess(actor.role,"employees"))return new NextResponse(null,{status:403});
 const{id}=await params;
 const target=await targetFor(actor.businessId,id);if(!target)return new NextResponse(null,{status:404});
 const rows=await prisma.$queryRaw<Array<{contentType:string;data:Buffer;updatedAt:Date}>>`SELECT "contentType", "data", "updatedAt" FROM "EmployeeProfilePhoto" WHERE "userId"=${id} LIMIT 1`;
 const photo=rows[0];if(!photo)return new NextResponse(null,{status:404});
 return new NextResponse(new Uint8Array(photo.data),{headers:{"Content-Type":photo.contentType,"Cache-Control":"private, max-age=300","Last-Modified":photo.updatedAt.toUTCString()}});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const actor=await getSessionUser("employees");
 if(!actor||!actor.businessId||!canAccess(actor.role,"employees"))return NextResponse.json({error:"Forbidden"},{status:403});
 const{id}=await params;const target=await targetFor(actor.businessId,id);if(!target)return NextResponse.json({error:"Employee not found"},{status:404});
 if(!canManageUser(actor.role,target.role))return NextResponse.json({error:"You cannot manage this employee."},{status:403});
 const form=await req.formData();const file=form.get("photo");if(!(file instanceof File))return NextResponse.json({error:"Choose a photo."},{status:400});
 if(!ALLOWED.has(file.type)||file.size<=0||file.size>MAX_BYTES)return NextResponse.json({error:"Use a JPG, PNG, WebP or HEIC photo up to 5 MB."},{status:400});
 const data=Buffer.from(await file.arrayBuffer());
 await prisma.$executeRaw`INSERT INTO "EmployeeProfilePhoto" ("userId","contentType","originalName","sizeBytes","data","updatedAt") VALUES (${id},${file.type},${file.name},${file.size},${data},CURRENT_TIMESTAMP) ON CONFLICT ("userId") DO UPDATE SET "contentType"=EXCLUDED."contentType","originalName"=EXCLUDED."originalName","sizeBytes"=EXCLUDED."sizeBytes","data"=EXCLUDED."data","updatedAt"=CURRENT_TIMESTAMP`;
 await recordAudit({actor,action:"EMPLOYEE_PHOTO_UPDATED",entityType:"User",entityId:id,details:{businessId:actor.businessId,sizeBytes:file.size,contentType:file.type}});
 return NextResponse.json({ok:true});
}

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}){
 const actor=await getSessionUser("employees");
 if(!actor||!actor.businessId||!canAccess(actor.role,"employees"))return NextResponse.json({error:"Forbidden"},{status:403});
 const{id}=await params;const target=await targetFor(actor.businessId,id);if(!target)return NextResponse.json({error:"Employee not found"},{status:404});
 if(!canManageUser(actor.role,target.role))return NextResponse.json({error:"You cannot manage this employee."},{status:403});
 await prisma.$executeRaw`DELETE FROM "EmployeeProfilePhoto" WHERE "userId"=${id}`;
 await recordAudit({actor,action:"EMPLOYEE_PHOTO_REMOVED",entityType:"User",entityId:id,details:{businessId:actor.businessId}});
 return NextResponse.json({ok:true});
}
