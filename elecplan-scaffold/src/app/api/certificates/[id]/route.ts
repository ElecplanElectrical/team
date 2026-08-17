import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  status: z.enum(["PENDING", "ISSUED", "EXPIRING"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can manage certificates" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const certificate = await prisma.certificate.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(certificate);
  } catch {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
}
