import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type BucketRow = {
  count: number;
  expiresAt: Date;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  justBlocked: boolean;
};

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
let lastCleanupAt = 0;
let cleanupInFlight: Promise<void> | null = null;

export function rateLimitIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function maybeCleanupExpiredBuckets(now: Date): Promise<void> {
  if (now.getTime() - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  if (cleanupInFlight) return cleanupInFlight;

  lastCleanupAt = now.getTime();
  cleanupInFlight = prisma.rateLimitBucket
    .deleteMany({ where: { expiresAt: { lt: now } } })
    .then(() => undefined)
    .catch(() => {
      lastCleanupAt = 0;
    })
    .finally(() => {
      cleanupInFlight = null;
    });

  return cleanupInFlight;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  // Best-effort maintenance only: limiter correctness does not depend on cleanup succeeding.
  void maybeCleanupExpiredBuckets(now);

  const rows = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING "count", "expiresAt"
  `;

  const bucket = rows[0];
  if (!bucket) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      justBlocked: true,
    };
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)),
    justBlocked: bucket.count === limit + 1,
  };
}

export async function clearRateLimits(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await prisma.rateLimitBucket.deleteMany({ where: { key: { in: keys } } });
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
