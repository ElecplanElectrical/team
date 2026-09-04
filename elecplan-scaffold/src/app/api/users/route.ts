import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, assignableRoles } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { generateToken, expiryFromNow, setPasswordUrl, INVITE_TTL_HOURS } from "@/lib/tokens";

const createSchema = z.object({ name: z.string().trim().min(1, "Name is required").max(120), email: z.string().trim().toLowerCase().email().max(160), phone: z.string().trim().max(40).optional().nullable(), role: z.enum(["ADMIN", "SUPERVISOR", "EMPLOYEE"]) });

function passwordLinkOrigin(req: Request, businessSlug?: string | null): string {
  if (businessSlug === "qls") return "https://qls.your-plan.com.au";
  return process.env.APP_ORIGIN ?? process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
}

async function employeeContext(){
  const actor=await getSessionUser("employees");
  if(!actor)return{error:NextResponse.json({error:"Unauthorized or Employees module disabled"},{status:403})}as const;
  if(!canAccess(actor.role,"employees"))return{error:NextResponse.json({error:"Forbidden"},{status:403})}as const;
  if(!actor.businessId)return{error:NextResponse.json({error:"No active customer business selected."},{status:409})}as const;
  return{actor,businessId:actor.businessId}as const;
}

export async function GET(){
  const ctx=await employeeContext();
  if("error" in ctx)return ctx.error;
  const users=await prisma.user.findMany({where:{businessId:ctx.businessId},select:{id:true,name:true,email:true,phone:true,role:true,active:true,licenseNumber:true,licenseExpiry:true,createdAt:true},orderBy:[{active:"desc"},{name:"asc"}]});
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const ctx=await employeeContext();
  if("error" in ctx)return ctx.error;
  const {actor,businessId}=ctx;
  const limit = await consumeRateLimit(`user-invite:actor:${actor.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    await recordAudit({ actor, action: "USER_INVITE_RATE_LIMITED", entityType: "User", details: { businessId, retryAfterSeconds: limit.retryAfterSeconds } });
    return NextResponse.json({ error: "Too many user invitations have been created. Try again later." }, { status: 429, headers: rateLimitHeaders(limit) });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (!assignableRoles(actor.role).includes(d.role)) return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  const { raw, hash } = generateToken();
  const user = await prisma.user.create({ data: { businessId, name: d.name, email: d.email, phone: d.phone || null, role: d.role, passwordTokens: { create: { tokenHash: hash, type: "INVITE", expiresAt: expiryFromNow(INVITE_TTL_HOURS) } } }, select: { id: true, name: true, email: true, role: true } });
  await recordAudit({ actor, action: "USER_INVITED", entityType: "User", entityId: user.id, details: { businessId, targetEmail: user.email, targetRole: user.role } });
  const inviteUrl = setPasswordUrl(passwordLinkOrigin(req, actor.business?.slug), raw);
  return NextResponse.json({ user, inviteUrl }, { status: 201 });
}
