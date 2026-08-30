import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { generateToken, expiryFromNow, setPasswordUrl, INVITE_TTL_HOURS } from "@/lib/tokens";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(160),
  phone: z.string().trim().max(40).optional().nullable(),
  role: z.enum(["ADMIN", "SUPERVISOR", "EMPLOYEE"]),
});

async function businessOr404(id: string) {
  return prisma.businessPortal.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, active: true, contactEmail: true },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const business = await businessOr404(id);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const users = await prisma.user.findMany({
    where: { businessId: id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true, passwordHash: true },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    business,
    users: users.map(({ passwordHash, ...user }) => ({ ...user, setupComplete: !!passwordHash })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const business = await businessOr404(id);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  if (!business.active) return NextResponse.json({ error: "Customer is inactive" }, { status: 409 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid user details" }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const { raw, hash } = generateToken();
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        businessId: id,
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        role: d.role,
        active: true,
        passwordTokens: {
          create: { tokenHash: hash, type: "INVITE", expiresAt: expiryFromNow(INVITE_TTL_HOURS) },
        },
      },
      select: { id: true, name: true, email: true, phone: true, role: true, active: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "PLATFORM_CUSTOMER_USER_INVITED",
        entityType: "User",
        entityId: created.id,
        details: { businessId: id, businessName: business.name, targetEmail: created.email, targetRole: created.role },
      },
    });
    return created;
  });

  return NextResponse.json({
    user,
    inviteUrl: setPasswordUrl(new URL(req.url).origin, raw),
    expiresInHours: INVITE_TTL_HOURS,
  }, { status: 201 });
}
