import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const createSchema = z.object({
  title: z.string().trim().min(1).max(140),
  hook: z.string().trim().max(280).optional().or(z.literal("")),
  platform: z.enum(["Instagram", "TikTok", "Facebook", "YouTube"]),
  status: z.enum(["IDEA", "READY", "SCHEDULED", "PUBLISHED"]).default("IDEA"),
  scheduledAt: z.string().optional().or(z.literal("")),
  publishedUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canAccess(user.role, "reels")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!actor?.active || !actor.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid reel idea" }, { status: 400 });
  const data = parsed.data;
  const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: "Invalid schedule date" }, { status: 400 });

  const idea = await prisma.reelIdea.create({ data: { businessId: actor.businessId, title: data.title, hook: data.hook || null, platform: data.platform, status: data.status, scheduledAt, publishedUrl: data.publishedUrl || null, notes: data.notes || null } });
  return NextResponse.json({ id: idea.id }, { status: 201 });
}
