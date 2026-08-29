import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { expiryFromNow, generateToken, INVITE_TTL_HOURS, RESET_TTL_HOURS, setPasswordUrl } from "@/lib/tokens";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });

  const { id } = await params;
  const business = await prisma.businessPortal.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      active: true,
      users: {
        where: { role: "ADMIN", active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, name: true, email: true, passwordHash: true },
      },
    },
  });

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (!business.active) return NextResponse.json({ error: "Reactivate this customer before issuing a setup link." }, { status: 409 });

  const owner = business.users[0];
  if (!owner) return NextResponse.json({ error: "This customer has no active administrator." }, { status: 409 });

  const type = owner.passwordHash ? "RESET" : "INVITE";
  const ttlHours = type === "INVITE" ? INVITE_TTL_HOURS : RESET_TTL_HOURS;
  const { raw, hash } = generateToken();

  await prisma.$transaction([
    prisma.passwordToken.deleteMany({ where: { userId: owner.id, usedAt: null } }),
    prisma.passwordToken.create({ data: { userId: owner.id, tokenHash: hash, type, expiresAt: expiryFromNow(ttlHours) } }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "PLATFORM_OWNER_SETUP_LINK_ISSUED",
        entityType: "User",
        entityId: owner.id,
        details: { businessId: business.id, businessName: business.name, ownerEmail: owner.email, tokenType: type, expiresInHours: ttlHours },
      },
    }),
  ]);

  return NextResponse.json({
    owner: { id: owner.id, name: owner.name, email: owner.email },
    type,
    expiresInHours: ttlHours,
    setupUrl: setPasswordUrl(new URL(req.url).origin, raw),
  });
}
