import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { pushConfigured } from "@/lib/push";

export async function GET(){
  const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  return NextResponse.json({publicKey:process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY||null,configured:pushConfigured()});
}
export async function POST(req:Request){
  const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const sub=await req.json().catch(()=>null) as {endpoint?:string;keys?:{p256dh?:string;auth?:string}}|null;
  if(!sub?.endpoint||!sub.keys?.p256dh||!sub.keys?.auth)return NextResponse.json({error:"Invalid subscription"},{status:400});
  await prisma.$executeRaw`
    INSERT INTO "PushSubscription" ("endpoint","userId","p256dh","auth","updatedAt")
    VALUES (${sub.endpoint},${user.id},${sub.keys.p256dh},${sub.keys.auth},CURRENT_TIMESTAMP)
    ON CONFLICT ("endpoint") DO UPDATE SET "userId"=${user.id},"p256dh"=${sub.keys.p256dh},"auth"=${sub.keys.auth},"updatedAt"=CURRENT_TIMESTAMP
  `;
  return NextResponse.json({ok:true});
}
