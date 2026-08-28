import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

async function context(){
  const user=await getSessionUser();
  if(!user)return{error:NextResponse.json({error:"Unauthorized"},{status:401})}as const;
  if(!canAccess(user.role,"reminders"))return{error:NextResponse.json({error:"Forbidden"},{status:403})}as const;
  const dbUser=await prisma.user.findUnique({where:{id:user.id},select:{businessId:true,active:true}});
  if(!dbUser?.active||!dbUser.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{user,businessId:dbUser.businessId}as const;
}

export async function GET(){
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const reminders=await prisma.reminder.findMany({
    where:{businessId:ctx.businessId,...(ctx.user.role==="EMPLOYEE"?{userId:ctx.user.id}:{})},
    include:{user:{select:{id:true,name:true,email:true}}},
    orderBy:[{completed:"asc"},{dueDate:"asc"}],
  });
  return NextResponse.json(reminders);
}

export async function POST(req: Request) {
  const ctx=await context();
  if("error" in ctx)return ctx.error;
  const {user,businessId}=ctx;

  const body = await req.json().catch(() => null) as { title?: string; dueDate?: string | null; tag?: string | null } | null;
  const title = body?.title?.trim();
  const tag = body?.tag?.trim() || null;
  const dueDate = body?.dueDate ? new Date(body.dueDate) : null;
  if (!title) return NextResponse.json({ error: "Reminder title is required" }, { status: 400 });
  if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });

  const reminder = await prisma.reminder.create({ data: { businessId, userId: user.id, title, dueDate, tag } });
  return NextResponse.json(reminder, { status: 201 });
}
