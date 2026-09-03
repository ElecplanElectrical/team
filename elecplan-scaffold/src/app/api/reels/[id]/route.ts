import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const patchSchema = z.object({ status: z.enum(["IDEA", "READY", "SCHEDULED", "PUBLISHED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!canAccess(user.role, "reels")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const updated = await prisma.reelIdea.updateMany({
    where: { id, businessId: user.businessId },
    data: { status: parsed.data.status },
  });
  if (updated.count !== 1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
