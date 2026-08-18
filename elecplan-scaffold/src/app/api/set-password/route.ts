import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { clearRateLimits, consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

const schema = z.object({
  token: z.string().min(20).max(500),
  password: z.string().min(12, "Use at least 12 characters.").max(200),
});

const TOKEN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const TOKEN_ATTEMPT_LIMIT = 10;

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const limiterKey = `set-password:${tokenHash}`;
  const limiter = await consumeRateLimit(limiterKey, TOKEN_ATTEMPT_LIMIT, TOKEN_ATTEMPT_WINDOW_MS);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later or ask your admin for a new link." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  const record = await prisma.passwordToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, type: true, usedAt: true, expiresAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link is invalid or has expired. Ask your admin for a new one." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, ...(record.type === "INVITE" ? { active: true } : {}) },
    }),
    prisma.passwordToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  await clearRateLimits([limiterKey]);
  await recordAudit({
    actor: {},
    action: record.type === "INVITE" ? "INVITE_PASSWORD_SET" : "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: record.userId,
    details: { tokenType: record.type },
  });

  return NextResponse.json({ ok: true });
}
