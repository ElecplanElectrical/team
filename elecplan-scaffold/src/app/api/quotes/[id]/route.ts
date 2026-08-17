import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "quotes")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote status" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const before = await prisma.quote.findUnique({
      where: { id },
      select: {
        status: true,
        quoteNumber: true,
        amount: true,
        convertedInvoice: { select: { id: true, invoiceNumber: true } },
      },
    });
    if (!before) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (before.convertedInvoice) {
      return NextResponse.json(
        {
          error: "Converted quotes are locked. Update the linked invoice instead.",
          invoice: before.convertedInvoice,
        },
        { status: 409 },
      );
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });
    await recordAudit({
      actor: user,
      action: "QUOTE_STATUS_CHANGED",
      entityType: "Quote",
      entityId: id,
      details: { quoteNumber: before.quoteNumber, from: before.status, to: parsed.data.status, amount: Number(before.amount) },
    });
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
}
