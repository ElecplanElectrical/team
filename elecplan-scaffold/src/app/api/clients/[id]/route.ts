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

async function authorize() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canAccess(user.role, "clients")) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });

  const { id } = await context.params;
  const d = parsed.data;
  const before = await prisma.client.findUnique({ where: { id }, select: { name: true, contactName: true, phone: true, email: true, address: true, billingNotes: true } });
  if (!before) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  try {
    const client = await prisma.client.update({ where: { id }, data: { name: d.name, contactName: d.contactName || null, phone: d.phone || null, email: d.email || null, address: d.address || null, billingNotes: d.billingNotes || null } });
    const changedFields = [before.name !== client.name ? "name" : null, before.contactName !== client.contactName ? "contactName" : null, before.phone !== client.phone ? "phone" : null, before.email !== client.email ? "email" : null, before.address !== client.address ? "address" : null, before.billingNotes !== client.billingNotes ? "billingNotes" : null].filter((field): field is string => Boolean(field));
    if (changedFields.length > 0) await recordAudit({ actor: user, action: "CLIENT_UPDATED", entityType: "Client", entityId: client.id, details: { name: client.name, changedFields } });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const user = auth.user;
  const { id } = await context.params;

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, name: true, _count: { select: { jobs: true, invoices: true } } } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (client._count.jobs > 0 || client._count.invoices > 0) {
    return NextResponse.json({ error: `This client cannot be deleted because it has ${client._count.jobs} job${client._count.jobs === 1 ? "" : "s"} and ${client._count.invoices} invoice${client._count.invoices === 1 ? "" : "s"} linked to it. Keep the client for your records.` }, { status: 409 });
  }

  await prisma.client.delete({ where: { id } });
  await recordAudit({ actor: user, action: "CLIENT_DELETED", entityType: "Client", entityId: id, details: { name: client.name } });
  return NextResponse.json({ ok: true });
}
