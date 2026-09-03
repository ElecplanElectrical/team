import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { pushConfigured, validPushEndpoint } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine(validPushEndpoint, "Unsupported push service"),
  keys: z.object({
    p256dh: z.string().min(80).max(200),
    auth: z.string().min(16).max(100),
  }),
});

async function activeTenantUser() {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (!user.businessId) return { response: NextResponse.json({ error: "No active customer business selected." }, { status: 409 }) } as const;
  return { user } as const;
}

export async function GET(){
  const auth=await activeTenantUser();
  if("response" in auth)return auth.response;
  return NextResponse.json({publicKey:process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY||null,configured:pushConfigured()});
}
export async function POST(req:Request){
  const auth=await activeTenantUser();
  if("response" in auth)return auth.response;
  if(!pushConfigured())return NextResponse.json({error:"Push notifications are not configured"},{status:503});
  const user=auth.user;
  const parsed=subscriptionSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid push subscription"},{status:400});
  const sub=parsed.data;
  await prisma.$executeRaw`
    INSERT INTO "PushSubscription" ("endpoint","userId","p256dh","auth","updatedAt")
    VALUES (${sub.endpoint},${user.id},${sub.keys.p256dh},${sub.keys.auth},CURRENT_TIMESTAMP)
    ON CONFLICT ("endpoint") DO UPDATE SET "userId"=${user.id},"p256dh"=${sub.keys.p256dh},"auth"=${sub.keys.auth},"updatedAt"=CURRENT_TIMESTAMP
  `;
  return NextResponse.json({ok:true});
}
