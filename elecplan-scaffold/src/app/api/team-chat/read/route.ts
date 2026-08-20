import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  await prisma.$executeRaw`
    INSERT INTO "TeamChatReadState" ("userId","lastReadAt") VALUES (${user.id},CURRENT_TIMESTAMP)
    ON CONFLICT ("userId") DO UPDATE SET "lastReadAt" = CURRENT_TIMESTAMP
  `;
  return NextResponse.json({ok:true});
}
