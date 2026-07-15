import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { EVENT_TYPES } from "@/lib/theme";

const patchSchema = z.object({
  title: z.string().trim().max(120).optional().nullable(),
  type: z.enum(EVENT_TYPES).optional(),
  jobId: z.string().cuid().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

async function canMutate(
  userId: string,
  role: string,
  eventId: string,
): Promise<boolean> {
  if (role === "ADMIN" || role === "SUPERVISOR") return true;
  const ev = await prisma.jobEvent.findUnique({
    where: { id: eventId },
    select: { assignedToId: true },
  });
  return !!ev && ev.assignedToId === userId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (!(await canMutate(user.id, user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const event = await prisma.jobEvent.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title?.trim() || null } : {}),
        ...(d.type ? { type: d.type } : {}),
        ...(d.jobId !== undefined ? { jobId: d.jobId } : {}),
        ...(d.assignedToId !== undefined
          ? { assignedToId: user.role === "EMPLOYEE" ? user.id : d.assignedToId }
          : {}),
        ...(d.startsAt ? { startsAt: new Date(d.startsAt) } : {}),
        ...(d.endsAt ? { endsAt: new Date(d.endsAt) } : {}),
      },
    });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (!(await canMutate(user.id, user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.jobEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
