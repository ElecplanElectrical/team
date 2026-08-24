import { NextResponse } from "next/server";
import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "leads")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const body = await req.json().catch(() => null) as { stage?: LeadStage } | null;
  if (!body?.stage || !Object.values(LeadStage).includes(body.stage)) return NextResponse.json({ error: "Invalid lead stage" }, { status: 400 });

  const { id } = await params;
  const updated = await prisma.lead.updateMany({ where: { id, businessId }, data: { stage: body.stage } });
  if (updated.count !== 1) return NextResponse.json({ error: "Lead not found for this business" }, { status: 404 });
  const lead = await prisma.lead.findFirst({ where: { id, businessId } });
  return NextResponse.json(lead);
}
