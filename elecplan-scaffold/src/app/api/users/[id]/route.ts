import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, canManageUser } from "@/lib/access";

const patchSchema = z.object({
  active: z.boolean(),
});

// Activate / deactivate a user. Deactivated users cannot log in (see auth.ts).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(actor.role, "employees")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!canManageUser(actor.role, target.role)) {
    return NextResponse.json({ error: "You cannot manage this user." }, { status: 403 });
  }
  if (target.id === actor.id && parsed.data.active === false) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { active: parsed.data.active },
    select: { id: true, active: true },
  });
  return NextResponse.json(user);
}
