import { NextResponse } from "next/server";
import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "leads")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { stage?: LeadStage } | null;
  if (!body?.stage || !Object.values(LeadStage).includes(body.stage)) {
    return NextResponse.json({ error: "Invalid lead stage" }, { status: 400 });
  }

  try {
    const { id } = await params;
    const lead = await prisma.lead.update({ where: { id }, data: { stage: body.stage } });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}
