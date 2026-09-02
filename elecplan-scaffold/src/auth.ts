import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { recordAudit } from "@/lib/audit";
import {
  clearRateLimits,
  consumeRateLimit,
  rateLimitIdentity,
} from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 8;
const LOGIN_IP_LIMIT = 40;
const DEMO_EMAIL = "demo@your-plan.com.au";
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("elecplan-invalid-login-sentinel", 10);

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Business portal", type: "text" },
      },
      authorize: async (raw, request) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const ip = requestIp(request);
        const emailKey = `login:email:${rateLimitIdentity(email)}`;
        const ipKey = `login:ip:${rateLimitIdentity(ip)}`;

        const [emailLimit, ipLimit] = await Promise.all([
          consumeRateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS),
          consumeRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS),
        ]);

        if (!emailLimit.allowed || !ipLimit.allowed) {
          if (emailLimit.justBlocked || ipLimit.justBlocked) {
            await recordAudit({
              actor: {},
              action: "LOGIN_RATE_LIMITED",
              entityType: "Auth",
              details: {
                emailScope: emailLimit.justBlocked,
                ipScope: ipLimit.justBlocked,
              },
            });
          }
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { business: { select: { slug: true } } },
        });
        const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const valid = await bcrypt.compare(parsed.data.password, passwordHash);

        // Keep all invalid-account states on the same outward failure path.
        if (!user?.passwordHash || !user.active || !valid) return null;
        if (parsed.data.tenantSlug && user.business?.slug !== parsed.data.tenantSlug) return null;

        await clearRateLimits([emailKey, ipKey]);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          demo: email === DEMO_EMAIL,
          businessSlug: user.business?.slug ?? null,
        };
      },
    }),
  ],
});
