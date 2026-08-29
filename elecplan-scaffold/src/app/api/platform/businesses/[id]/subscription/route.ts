import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { getBusinessSubscription } from "@/lib/subscription";

const statusSchema = z.enum(["ACTIVE", "TRIAL", "GRACE", "PAST_DUE", "SUSPENDED", "CANCELLED"]);
const patchSchema = z.object({
  status: statusSchema.optional(),
  setupFee: z.number().min(0).max(100000).optional(),
  gracePeriodDays: z.number().int().min(0).max(90).optional(),
  graceEndsAt: z.string().datetime().nullable().optional(),
  currentPeriodEnd: z.string().datetime().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  cancelledAt: z.string().datetime().nullable().optional(),
  provider: z.string().trim().max(80).nullable().optional(),
  providerCustomerId: z.string().trim().max(200).nullable().optional(),
  providerSubscriptionId: z.string().trim().max(200).nullable().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const business = await prisma.businessPortal.findUnique({ where: { id }, select: { id: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json(await getBusinessSubscription(id));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });
  const { id } = await params;
  const business = await prisma.businessPortal.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription settings" }, { status: 400 });
  const p = parsed.data;

  if (p.status === "GRACE" || p.status === "PAST_DUE") {
    if (p.graceEndsAt === undefined) {
      const current = await getBusinessSubscription(id);
      const end = new Date(Date.now() + current.gracePeriodDays * 86400000);
      p.graceEndsAt = end.toISOString();
    }
  }
  if (p.status === "CANCELLED" && p.cancelledAt === undefined) p.cancelledAt = new Date().toISOString();
  if (p.status === "ACTIVE" || p.status === "TRIAL") {
    if (p.graceEndsAt === undefined) p.graceEndsAt = null;
    if (p.cancelledAt === undefined) p.cancelledAt = null;
    if (p.cancelAtPeriodEnd === undefined) p.cancelAtPeriodEnd = false;
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  const push = (column: string, value: unknown) => { values.push(value); sets.push(`"${column}" = $${values.length}`); };
  if (p.status !== undefined) push("status", p.status);
  if (p.setupFee !== undefined) push("setupFee", p.setupFee);
  if (p.gracePeriodDays !== undefined) push("gracePeriodDays", p.gracePeriodDays);
  if (p.graceEndsAt !== undefined) push("graceEndsAt", p.graceEndsAt ? new Date(p.graceEndsAt) : null);
  if (p.currentPeriodEnd !== undefined) push("currentPeriodEnd", p.currentPeriodEnd ? new Date(p.currentPeriodEnd) : null);
  if (p.cancelAtPeriodEnd !== undefined) push("cancelAtPeriodEnd", p.cancelAtPeriodEnd);
  if (p.cancelledAt !== undefined) push("cancelledAt", p.cancelledAt ? new Date(p.cancelledAt) : null);
  if (p.provider !== undefined) push("provider", p.provider);
  if (p.providerCustomerId !== undefined) push("providerCustomerId", p.providerCustomerId);
  if (p.providerSubscriptionId !== undefined) push("providerSubscriptionId", p.providerSubscriptionId);
  if (!sets.length) return NextResponse.json(await getBusinessSubscription(id));

  values.push(id);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `UPDATE "BusinessSubscription" SET ${sets.join(", ")}, "updatedAt" = CURRENT_TIMESTAMP WHERE "businessId" = $${values.length}`,
      ...values,
    );
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "PLATFORM_SUBSCRIPTION_UPDATED",
        entityType: "BusinessPortal",
        entityId: id,
        details: { businessName: business.name, changedFields: Object.keys(p), status: p.status ?? undefined },
      },
    });
  });

  return NextResponse.json(await getBusinessSubscription(id));
}
