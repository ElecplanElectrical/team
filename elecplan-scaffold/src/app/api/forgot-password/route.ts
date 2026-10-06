import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  rateLimitHeaders,
  rateLimitIdentity,
} from "@/lib/rate-limit";
import {
  generateToken,
  expiryFromNow,
  setPasswordUrl,
  RESET_TTL_HOURS,
} from "@/lib/tokens";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
});

const WINDOW_MS = 60 * 60 * 1000;
const EMAIL_LIMIT = 5;
const IP_LIMIT = 20;

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function clickSendAuth(): string | null {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  if (!username || !apiKey) return null;
  return Buffer.from(`${username}:${apiKey}`).toString("base64");
}

async function getClickSendFromAddress(auth: string): Promise<number | null> {
  const configured = Number(process.env.CLICKSEND_EMAIL_ADDRESS_ID);
  if (Number.isFinite(configured) && configured > 0) return configured;

  const response = await fetch("https://rest.clicksend.com/v3/email/addresses?limit=100", {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null) as {
    data?: { data?: Array<{ id?: number; email_address_id?: number }> };
  } | null;
  const first = payload?.data?.data?.[0];
  return first?.email_address_id ?? first?.id ?? null;
}

async function sendResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const auth = clickSendAuth();
  if (!auth) return false;

  const fromId = await getClickSendFromAddress(auth);
  if (!fromId) return false;

  const body = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111827">
      <h2 style="margin-bottom:8px">Reset your Elecplan password</h2>
      <p>A password reset was requested for your Elecplan account.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#43d2ff;color:#071827;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">
          Reset password
        </a>
      </p>
      <p>This link is single-use and expires in ${RESET_TTL_HOURS} hours.</p>
      <p>If you did not request this reset, you can ignore this email.</p>
    </div>
  `;

  const response = await fetch("https://rest.clicksend.com/v3/email/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email: to, name: "Elecplan user" }],
      from: { email_address_id: fromId, name: "Elecplan" },
      subject: "Reset your Elecplan password",
      body,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as {
    response_code?: string;
  } | null;

  return response.ok && payload?.response_code === "SUCCESS";
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email;
  const ip = requestIp(req);
  const [emailLimit, ipLimit] = await Promise.all([
    consumeRateLimit(`forgot-password:email:${rateLimitIdentity(email)}`, EMAIL_LIMIT, WINDOW_MS),
    consumeRateLimit(`forgot-password:ip:${rateLimitIdentity(ip)}`, IP_LIMIT, WINDOW_MS),
  ]);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const limiter = !emailLimit.allowed ? emailLimit : ipLimit;
    return NextResponse.json(
      { error: "Too many reset requests. Try again later." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, active: true, email: true },
  });

  // Never reveal whether a supplied email belongs to an Elecplan account.
  if (!user?.active) {
    return NextResponse.json({ ok: true });
  }

  const { raw, hash } = generateToken();
  const resetUrl = setPasswordUrl(new URL(req.url).origin, raw);

  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        type: "RESET",
        expiresAt: expiryFromNow(RESET_TTL_HOURS),
      },
    }),
  ]);

  const sent = await sendResetEmail(user.email, resetUrl);
  if (!sent) {
    await prisma.passwordToken.deleteMany({
      where: { userId: user.id, tokenHash: hash, usedAt: null },
    });
    return NextResponse.json(
      { error: "Reset email could not be sent right now. Please try again shortly." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
