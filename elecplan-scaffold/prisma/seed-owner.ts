/**
 * Production bootstrap — creates ONLY the owner admin account (no demo data)
 * and prints a one-time "set your password" link.
 *
 * Idempotent: re-running updates the owner's name/role/active and issues a
 * fresh link, without touching any other data. Unlike prisma/seed.ts it never
 * wipes tables, so it's safe to run against a live database.
 *
 * Usage (against the production DB — e.g. in the Railway service shell):
 *   OWNER_NAME="Luke Phillips" \
 *   OWNER_EMAIL="luke@elecplan.com.au" \
 *   APP_ORIGIN="https://team.elecplan.com.au" \
 *   pnpm db:seed:owner
 *
 * OWNER_NAME/OWNER_EMAIL default to the values below; APP_ORIGIN falls back to
 * NEXTAUTH_URL, then localhost.
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
const ORIGIN =
  process.env.APP_ORIGIN ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { name: NAME, role: "ADMIN", active: true },
    create: { name: NAME, email: EMAIL, role: "ADMIN", active: true },
  });

  const { raw, hash } = generateToken();
  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId: owner.id, usedAt: null } }),
    prisma.passwordToken.create({
      data: {
        userId: owner.id,
        tokenHash: hash,
        type: "INVITE",
        expiresAt: expiryFromNow(INVITE_TTL_HOURS),
      },
    }),
  ]);

  console.log(`\nOwner ready: ${NAME} <${EMAIL}> (ADMIN)`);
  console.log(`Set your password (valid ${INVITE_TTL_HOURS}h, single use):`);
  console.log(setPasswordUrl(ORIGIN, raw));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
