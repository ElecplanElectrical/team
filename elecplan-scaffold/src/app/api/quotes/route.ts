import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const quoteSchema = z.object({
  clientId: z.string().trim().min(1),
  jobId: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive().max(10_000_000),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED"]).default("DRAFT"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "quotes")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quote details" }, { status: 400 });
  }
  const d = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (d.jobId) {
    const job = await prisma.job.findFirst({
      where: { id: d.jobId, clientId: d.clientId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Selected job does not belong to this client" }, { status: 400 });
    }
  }

  try {
    const quote = await prisma.quote.create({
      data: {
        clientId: d.clientId,
        jobId: d.jobId || null,
        amount: d.amount,
        status: d.status,
      },
      include: {
        client: { select: { name: true } },
        job: { select: { title: true } },
      },
    });
    return NextResponse.json(quote, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create quote" }, { status: 400 });
  }
}
