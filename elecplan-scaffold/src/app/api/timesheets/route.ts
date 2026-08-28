import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({ date: z.string().datetime(), hours: z.number().positive().max(24) });

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
  const entries=await prisma.timesheet.findMany({
    where:{businessId:ctx.businessId,...(ctx.user.role==="EMPLOYEE"?{userId:ctx.user.id}:{})},
    include:{user:{select:{id:true,name:true,email:true}}},
    orderBy:[{date:"desc"},{createdAt:"desc"}],
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid timesheet entry", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const entry = await prisma.timesheet.create({ data: { businessId, userId: user.id, date: new Date(parsed.data.date), hours: parsed.data.hours, status: "PENDING" } });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create timesheet entry" }, { status: 400 });
  }
}
