import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

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

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = billSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  try {
    const [client, job] = await Promise.all([
      d.clientId ? prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } }) : Promise.resolve(null),
      d.jobId ? prisma.job.findUnique({ where: { id: d.jobId }, select: { id: true, clientId: true } }) : Promise.resolve(null),
    ]);

    if (d.clientId && !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (d.jobId && !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job && d.clientId && job.clientId !== d.clientId) {
      return NextResponse.json({ error: "Selected job does not belong to this client" }, { status: 400 });
    }
    if (job && !d.clientId && !d.supplier) {
      return NextResponse.json({ error: "A client or supplier is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        clientId: d.clientId || null,
        supplier: d.supplier || null,
        jobId: d.jobId || null,
        amount: d.amount,
        dueDate: new Date(d.dueDate),
        status: d.status,
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create bill" }, { status: 400 });
  }
}
