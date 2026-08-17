import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canAccess(user.role, "reviews")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    clientId?: string;
    rating?: number;
    text?: string;
    source?: string;
  } | null;

  const clientId = body?.clientId?.trim();
  const rating = Number(body?.rating);
  const text = body?.text?.trim() || null;
  const source = body?.source?.trim() || null;

  if (!clientId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Client and a 1-5 star rating are required." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const review = await prisma.review.create({
    data: { clientId, rating, text, source },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}
