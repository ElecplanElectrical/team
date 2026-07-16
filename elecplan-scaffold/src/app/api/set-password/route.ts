import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

// Public (token-gated): a user sets their password via an invite or reset link.
const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link is invalid or has expired. Ask your admin for a new one." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    // Set the password and (re)activate the account.
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, active: true },
    }),
    // Consume this token and drop any other outstanding ones for the user.
    prisma.passwordToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
