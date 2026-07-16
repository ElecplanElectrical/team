import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, assignableRoles } from "@/lib/access";
import {
  generateToken,
  expiryFromNow,
  setPasswordUrl,
  INVITE_TTL_HOURS,
} from "@/lib/tokens";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  role: z.enum(["ADMIN", "SUPERVISOR", "EMPLOYEE"]),
});

// Invite a new user: creates the account with no password and returns a
// one-time "set your password" link for the admin to copy and hand off.
export async function POST(req: Request) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(actor.role, "employees")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Prevent privilege escalation: only assign roles you're allowed to.
  if (!assignableRoles(actor.role).includes(d.role)) {
    return NextResponse.json({ error: "You cannot assign that role." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists." },
      { status: 409 },
    );
  }

  const { raw, hash } = generateToken();
  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      role: d.role,
      // passwordHash stays null until they accept the invite via the link.
      passwordTokens: {
        create: {
          tokenHash: hash,
          type: "INVITE",
          expiresAt: expiryFromNow(INVITE_TTL_HOURS),
        },
      },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const inviteUrl = setPasswordUrl(new URL(req.url).origin, raw);
  return NextResponse.json({ user, inviteUrl }, { status: 201 });
}
