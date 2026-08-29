import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { DEFAULT_MODULES } from "@/lib/brand";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  contactName: z.string().trim().max(120).nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
  primaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  modules: z.array(z.enum(DEFAULT_MODULES)).min(1).optional(),
  plan: z.string().trim().min(1).max(80).optional(),
  monthlyPrice: z.number().min(0).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: "Platform owner access required" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid customer settings" }, { status: 400 });

  const existing = await prisma.businessPortal.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const business = await prisma.$transaction(async (tx) => {
    const updated = await tx.businessPortal.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true, name: true, slug: true, industry: true, contactName: true, contactEmail: true,
        logoUrl: true, primaryColor: true, accentColor: true, modules: true, plan: true,
        monthlyPrice: true, active: true, updatedAt: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "PLATFORM_CUSTOMER_UPDATED",
        entityType: "BusinessPortal",
        entityId: id,
        details: { businessName: updated.name, changedFields: Object.keys(parsed.data) },
      },
    });
    return updated;
  });

  return NextResponse.json(business);
}
