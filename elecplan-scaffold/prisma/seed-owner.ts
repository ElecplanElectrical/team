/**
 * Production bootstrap — creates ONLY the owner admin account (no demo data).
 *
 * Idempotent and safe for every deploy: it updates the owner's name/role/active
 * state, but only issues a set-password token when the owner does not already
 * have a password. Existing production credentials are never reset or rotated
 * just because the service redeployed.
 */
import { PrismaClient } from "@prisma/client";
import {
  generateToken,
  expiryFromNow,
  setPasswordUrl,
  INVITE_TTL_HOURS,
} from "../src/lib/tokens";

const prisma = new PrismaClient();

const NAME = process.env.OWNER_NAME ?? "Luke Phillips";
const EMAIL = (process.env.OWNER_EMAIL ?? "luke@elecplan.com.au").toLowerCase();
const ORIGIN = process.env.APP_ORIGIN ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { name: NAME, role: "ADMIN", active: true },
    create: { name: NAME, email: EMAIL, role: "ADMIN", active: true },
    select: { id: true, passwordHash: true },
  });

  if (owner.passwordHash) {
    // Remove any stale unused bootstrap invite tokens. Password resets created by
    // an explicit admin action use RESET tokens and are intentionally preserved.
    await prisma.passwordToken.deleteMany({
      where: { userId: owner.id, type: "INVITE", usedAt: null },
    });
    console.log(`Owner ready: ${NAME} <${EMAIL}> (ADMIN)`);
    return;
  }

  const { raw, hash } = generateToken();
  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId: owner.id, type: "INVITE", usedAt: null } }),
    prisma.passwordToken.create({
      data: {
        userId: owner.id,
        tokenHash: hash,
        type: "INVITE",
        expiresAt: expiryFromNow(INVITE_TTL_HOURS),
      },
    }),
  ]);

  console.log(`Owner ready: ${NAME} <${EMAIL}> (ADMIN)`);
  console.log(`Initial set-password link (valid ${INVITE_TTL_HOURS}h, single use):`);
  console.log(setPasswordUrl(ORIGIN, raw));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
