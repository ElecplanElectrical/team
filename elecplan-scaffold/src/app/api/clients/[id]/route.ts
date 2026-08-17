import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  contactName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(240).optional().nullable(),
  billingNotes: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "clients")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const d = parsed.data;

  try {
    const before = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
        billingNotes: true,
      },
    });
    if (!before) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: d.name,
        contactName: d.contactName || null,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        billingNotes: d.billingNotes || null,
      },
    });

    const changedFields = [
      before.name !== client.name ? "name" : null,
      before.contactName !== client.contactName ? "contactName" : null,
      before.phone !== client.phone ? "phone" : null,
      before.email !== client.email ? "email" : null,
      before.address !== client.address ? "address" : null,
      before.billingNotes !== client.billingNotes ? "billingNotes" : null,
    ].filter((value): value is string => Boolean(value));

    if (changedFields.length > 0) {
      await recordAudit({
        actor: user,
        action: "CLIENT_UPDATED",
        entityType: "Client",
        entityId: client.id,
        details: {
          changedFields,
          hasContactName: Boolean(client.contactName),
          hasPhone: Boolean(client.phone),
          hasEmail: Boolean(client.email),
          hasAddress: Boolean(client.address),
          hasBillingNotes: Boolean(client.billingNotes),
        },
      });
    }

    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
}
