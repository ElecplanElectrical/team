import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type RoomRow={id:string;name:string;jobId:string|null;isGeneral:boolean;memberCount:bigint;unread:bigint;latestBody:string|null;latestAt:Date|null};

async function authUser(){const user=await getSessionUser();if(!user)return {response:NextResponse.json({error:"Unauthorized"},{status:401})} as const;if(!user.businessId)return {response:NextResponse.json({error:"No active customer business selected."},{status:409})} as const;return {user,businessId:user.businessId} as const}

export async function GET(){
 const auth=await authUser();if("response" in auth)return auth.response;const {user,businessId}=auth;
 const rooms=await prisma.$queryRaw<RoomRow[]>`
 SELECT r."id",r."name",r."jobId",r."isGeneral",
   CASE WHEN r."isGeneral" THEN (SELECT COUNT(*) FROM "User" u WHERE u."businessId"=${businessId} AND u."active"=TRUE) ELSE (SELECT COUNT(*) FROM "TeamChatRoomMember" rm WHERE rm."roomId"=r."id") END AS "memberCount",
   (SELECT COUNT(*) FROM "TeamChatMessage" m WHERE m."roomId"=r."id" AND m."senderId"<>${user.id} AND m."createdAt">COALESCE((SELECT s."lastReadAt" FROM "TeamChatReadState" s WHERE s."userId"=${user.id} AND s."roomId"=r."id"),TIMESTAMP '1970-01-01')) AS unread,
   (SELECT m."body" FROM "TeamChatMessage" m WHERE m."roomId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "latestBody",
   (SELECT m."createdAt" FROM "TeamChatMessage" m WHERE m."roomId"=r."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "latestAt"
 FROM "TeamChatRoom" r
 WHERE r."businessId"=${businessId} AND (r."isGeneral"=TRUE OR EXISTS(SELECT 1 FROM "TeamChatRoomMember" rm WHERE rm."roomId"=r."id" AND rm."userId"=${user.id}))
 ORDER BY r."isGeneral" DESC, COALESCE((SELECT MAX(m."createdAt") FROM "TeamChatMessage" m WHERE m."roomId"=r."id"),r."createdAt") DESC`;
 const users=await prisma.user.findMany({where:{businessId,active:true},select:{id:true,name:true,role:true},orderBy:{name:"asc"}});
 const jobs=await prisma.job.findMany({where:{businessId,status:{not:"COMPLETE"}},select:{id:true,title:true},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({rooms:rooms.map(r=>({...r,memberCount:Number(r.memberCount),unread:Number(r.unread)})),users,jobs,me:user.id,canManage:user.role==="ADMIN"||user.role==="SUPERVISOR"});
}

export async function POST(req:Request){
 const auth=await authUser();if("response" in auth)return auth.response;const {user,businessId}=auth;
 if(user.role!=="ADMIN"&&user.role!=="SUPERVISOR")return NextResponse.json({error:"Only admins and supervisors can create chats."},{status:403});
 const data=await req.json().catch(()=>null) as {name?:string;memberIds?:string[];jobId?:string|null}|null;const name=data?.name?.trim();
 if(!name||name.length>80)return NextResponse.json({error:"Enter a chat name up to 80 characters."},{status:400});
 const requested=[...new Set([...(data?.memberIds||[]),user.id])];
 const valid=await prisma.user.findMany({where:{id:{in:requested},businessId,active:true},select:{id:true}});if(valid.length<2)return NextResponse.json({error:"Select at least one other team member."},{status:400});
 let jobId:string|null=null;if(data?.jobId){const job=await prisma.job.findFirst({where:{id:data.jobId,businessId},select:{id:true}});if(!job)return NextResponse.json({error:"Job not found."},{status:400});jobId=job.id}
 const roomId=randomUUID();await prisma.$transaction(async tx=>{await tx.$executeRaw`INSERT INTO "TeamChatRoom" ("id","businessId","name","jobId","createdById") VALUES (${roomId},${businessId},${name},${jobId},${user.id})`;for(const member of valid)await tx.$executeRaw`INSERT INTO "TeamChatRoomMember" ("roomId","userId") VALUES (${roomId},${member.id}) ON CONFLICT DO NOTHING`;});
 return NextResponse.json({ok:true,id:roomId},{status:201});
}
