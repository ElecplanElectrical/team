import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({ status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "quotes")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true } });
  if (!dbUser?.businessId) return NextResponse.json({ error: "No customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid quote status" }, { status: 400 });

  const { id } = await params;
  try {
    const before = await prisma.quote.findFirst({
      where: { id, businessId },
      select: { status: true, quoteNumber: true, amount: true, convertedInvoice: { select: { id: true, invoiceNumber: true } } },
    });
    if (!before) return NextResponse.json({ error: "Quote not found for this business" }, { status: 404 });
    if (before.convertedInvoice) return NextResponse.json({ error: "Converted quotes are locked. Update the linked invoice instead.", invoice: before.convertedInvoice }, { status: 409 });

    const updated = await prisma.quote.updateMany({ where: { id, businessId }, data: { status: parsed.data.status } });
    if (updated.count !== 1) return NextResponse.json({ error: "Quote not found for this business" }, { status: 404 });
    await recordAudit({ actor: user, action: "QUOTE_STATUS_CHANGED", entityType: "Quote", entityId: id, details: { businessId, quoteNumber: before.quoteNumber, from: before.status, to: parsed.data.status, amount: Number(before.amount) } });
    return NextResponse.json({ id, status: parsed.data.status });
  } catch {
    return NextResponse.json({ error: "Quote not found for this business" }, { status: 404 });
  }
}
