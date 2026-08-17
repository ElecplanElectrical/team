import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["UNPAID", "PAID", "OVERDUE"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { id } = await params;
  try {
    const before = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true, invoiceNumber: true, amount: true, clientId: true, supplier: true },
    });
    if (!before) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });
    await recordAudit({
      actor: user,
      action: "INVOICE_STATUS_CHANGED",
      entityType: "Invoice",
      entityId: id,
      details: {
        invoiceNumber: before.invoiceNumber,
        kind: before.clientId ? "client_invoice" : "supplier_bill",
        supplier: before.supplier,
        from: before.status,
        to: parsed.data.status,
        amount: Number(before.amount),
      },
    });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }
}
