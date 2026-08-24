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
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true } });
  if (!dbUser?.businessId) return { error: NextResponse.json({ error: "No customer business selected." }, { status: 409 }) };
  return { user, businessId: dbUser.businessId };
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { user, businessId } = auth;

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });

  const { id } = await context.params;
  const d = parsed.data;
  const before = await prisma.client.findFirst({
    where: { id, businessId },
    select: { name: true, contactName: true, phone: true, email: true, address: true, billingNotes: true },
  });
  if (!before) return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });

  try {
    const client = await prisma.client.update({
      where: { id },
      data: { name: d.name, contactName: d.contactName || null, phone: d.phone || null, email: d.email || null, address: d.address || null, billingNotes: d.billingNotes || null },
    });
    const changedFields = [before.name !== client.name ? "name" : null, before.contactName !== client.contactName ? "contactName" : null, before.phone !== client.phone ? "phone" : null, before.email !== client.email ? "email" : null, before.address !== client.address ? "address" : null, before.billingNotes !== client.billingNotes ? "billingNotes" : null].filter((field): field is string => Boolean(field));
    if (changedFields.length > 0) await recordAudit({ actor: user, action: "CLIENT_UPDATED", entityType: "Client", entityId: client.id, details: { businessId, name: client.name, changedFields } });
    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  const { user, businessId } = auth;
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can permanently delete clients and linked records." }, { status: 403 });

  const { id } = await context.params;
  const client = await prisma.client.findFirst({
    where: { id, businessId },
    select: {
      id: true,
      name: true,
      _count: { select: { jobs: true, invoices: true, quotes: true, leads: true, reviews: true } },
    },
  });
  if (!client) return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.jobEvent.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.certificate.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.inspection.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.projectPhoto.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.smsLog.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.document.deleteMany({ where: { job: { clientId: id, businessId } } });
      await tx.invoice.deleteMany({ where: { businessId, OR: [{ clientId: id }, { job: { clientId: id, businessId } }] } });
      await tx.quote.deleteMany({ where: { clientId: id, businessId } });
      await tx.lead.deleteMany({ where: { clientId: id, businessId } });
      await tx.review.deleteMany({ where: { clientId: id } });
      await tx.job.deleteMany({ where: { clientId: id, businessId } });
      await tx.client.delete({ where: { id } });
    });

    await recordAudit({
      actor: user,
      action: "CLIENT_DELETED",
      entityType: "Client",
      entityId: id,
      details: {
        businessId,
        name: client.name,
        deletedJobs: client._count.jobs,
        deletedInvoices: client._count.invoices,
        deletedQuotes: client._count.quotes,
        deletedLeads: client._count.leads,
        deletedReviews: client._count.reviews,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CLIENT_DELETE_FAILED", error);
    return NextResponse.json({ error: "Could not delete this client and its linked records." }, { status: 500 });
  }
}
