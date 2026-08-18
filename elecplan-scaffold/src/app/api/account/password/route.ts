import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { clearRateLimits, consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12, "Use at least 12 characters.").max(200),
});

const WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_LIMIT = 8;

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limiterKey = `change-password:user:${sessionUser.id}`;
  const limiter = await consumeRateLimit(limiterKey, ATTEMPT_LIMIT, WINDOW_MS);
  if (!limiter.allowed) {
    await recordAudit({
      actor: sessionUser,
      action: "PASSWORD_CHANGE_RATE_LIMITED",
      entityType: "User",
      entityId: sessionUser.id,
      details: { retryAfterSeconds: limiter.retryAfterSeconds },
    });
    return NextResponse.json(
      { error: "Too many password attempts. Try again later." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "No password set for this account." }, { status: 400 });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    return NextResponse.json({ error: "Choose a new password that is different from your current password." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash },
    }),
    prisma.passwordToken.deleteMany({ where: { userId: sessionUser.id, usedAt: null } }),
  ]);

  await clearRateLimits([limiterKey]);
  await recordAudit({
    actor: sessionUser,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: sessionUser.id,
  });

  return NextResponse.json({ ok: true });
}
