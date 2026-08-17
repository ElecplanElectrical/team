import { NextResponse } from "next/server";
import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "leads")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { clientId?: string; description?: string; value?: number; source?: string; stage?: LeadStage } | null;
  const clientId = body?.clientId?.trim();
  const description = body?.description?.trim();
  const value = Number(body?.value);
  const source = body?.source?.trim() || null;
  const stage = body?.stage && Object.values(LeadStage).includes(body.stage) ? body.stage : LeadStage.NEW;

  if (!clientId || !description || !Number.isFinite(value) || value < 0) {
    return NextResponse.json({ error: "Client, description and a valid value are required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });

  const lead = await prisma.lead.create({ data: { clientId, description, value, source, stage } });
  return NextResponse.json(lead, { status: 201 });
}
