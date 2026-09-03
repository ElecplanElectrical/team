import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["PENDING", "ISSUED", "EXPIRING"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can manage certificates" }, { status: 403 });

  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { id } = await params;
  const before = await prisma.certificate.findFirst({
    where: { id, job: { businessId } },
    select: { id: true, certNumber: true, status: true, issuedDate: true, jobId: true, electricianId: true },
  });
  if (!before) return NextResponse.json({ error: "Certificate not found for this business" }, { status: 404 });

  if (parsed.data.status !== "PENDING" && !before.issuedDate) {
    return NextResponse.json({ error: "Add an issued date before marking this certificate as issued or expiring" }, { status: 409 });
  }

  try {
    const updated = await prisma.certificate.updateMany({ where: { id, job: { businessId } }, data: { status: parsed.data.status } });
    if (updated.count !== 1) return NextResponse.json({ error: "Certificate not found for this business" }, { status: 404 });
    const certificate = await prisma.certificate.findFirst({ where: { id, job: { businessId } } });
    if (!certificate) return NextResponse.json({ error: "Certificate not found for this business" }, { status: 404 });

    if (before.status !== certificate.status) {
      await recordAudit({ actor: user, action: "CERTIFICATE_STATUS_CHANGED", entityType: "Certificate", entityId: certificate.id, details: { businessId, certNumber: before.certNumber, jobId: before.jobId, electricianId: before.electricianId, from: before.status, to: certificate.status, issuedDate: before.issuedDate?.toISOString().slice(0, 10) ?? null } });
    }

    return NextResponse.json(certificate);
  } catch {
    return NextResponse.json({ error: "Certificate not found for this business" }, { status: 404 });
  }
}
