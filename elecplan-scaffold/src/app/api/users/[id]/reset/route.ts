import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess, canManageUser } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  generateToken,
  expiryFromNow,
  setPasswordUrl,
  RESET_TTL_HOURS,
} from "@/lib/tokens";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(actor.role, "employees")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!canManageUser(actor.role, target.role)) {
    return NextResponse.json({ error: "You cannot manage this user." }, { status: 403 });
  }

  const limit = await consumeRateLimit(`password-reset:actor:${actor.id}:target:${id}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    await recordAudit({
      actor,
      action: "PASSWORD_RESET_RATE_LIMITED",
      entityType: "User",
      entityId: target.id,
      details: { targetEmail: target.email, retryAfterSeconds: limit.retryAfterSeconds },
    });
    return NextResponse.json(
      { error: "Too many password reset links have been issued for this user. Try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const { raw, hash } = generateToken();
  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId: id, usedAt: null } }),
    prisma.passwordToken.create({
      data: { userId: id, tokenHash: hash, type: "RESET", expiresAt: expiryFromNow(RESET_TTL_HOURS) },
    }),
  ]);

  await recordAudit({
    actor,
    action: "PASSWORD_RESET_LINK_ISSUED",
    entityType: "User",
    entityId: target.id,
    details: { targetEmail: target.email, targetRole: target.role, expiresInHours: RESET_TTL_HOURS },
  });

  const resetUrl = setPasswordUrl(new URL(req.url).origin, raw);
  return NextResponse.json({ resetUrl });
}
