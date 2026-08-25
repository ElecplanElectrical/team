import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const billSchema = z.object({
  clientId: z.string().trim().optional().nullable(),
  supplier: z.string().trim().max(160).optional().nullable(),
  jobId: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive().max(100000000),
  dueDate: z.string().datetime(),
  status: z.enum(["UNPAID", "PAID", "OVERDUE"]).default("UNPAID"),
}).refine((d) => Boolean(d.clientId || d.supplier), {
  message: "A client or supplier is required",
  path: ["clientId"],
});

function billNumber() {
  return `BILL-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const parsed = billSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  try {
    const [client, job] = await Promise.all([
      d.clientId ? prisma.client.findFirst({ where: { id: d.clientId, businessId }, select: { id: true } }) : Promise.resolve(null),
      d.jobId ? prisma.job.findFirst({ where: { id: d.jobId, businessId }, select: { id: true, clientId: true } }) : Promise.resolve(null),
    ]);

    if (d.clientId && !client) return NextResponse.json({ error: "Client not found for this business" }, { status: 404 });
    if (d.jobId && !job) return NextResponse.json({ error: "Job not found for this business" }, { status: 404 });
    if (job && d.clientId && job.clientId !== d.clientId) return NextResponse.json({ error: "Selected job does not belong to this client" }, { status: 400 });

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        invoiceNumber: billNumber(),
        clientId: d.clientId || null,
        supplier: d.supplier || null,
        jobId: d.jobId || null,
        amount: d.amount,
        dueDate: new Date(d.dueDate),
        status: d.status,
      },
    });

    await recordAudit({ actor: user, action: "BILL_CREATED", entityType: "Invoice", entityId: invoice.id, details: { businessId, clientId: d.clientId || null, supplier: d.supplier || null, jobId: d.jobId || null, amount: d.amount } });
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create bill" }, { status: 400 });
  }
}
