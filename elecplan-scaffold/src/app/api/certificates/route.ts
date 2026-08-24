import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ certNumber: z.string().trim().min(1).max(80), type: z.string().trim().min(1).max(120), jobId: z.string().cuid(), electricianId: z.string().cuid(), issuedDate: z.string().datetime().optional().nullable(), status: z.enum(["PENDING", "ISSUED", "EXPIRING"]) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can manage certificates" }, { status: 403 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid certificate details", issues: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  if (data.status !== "PENDING" && !data.issuedDate) return NextResponse.json({ error: "Issued and expiring certificates require an issued date" }, { status: 400 });

  const [job, electrician] = await Promise.all([
    prisma.job.findFirst({ where: { id: data.jobId, businessId }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: data.electricianId, businessId, active: true }, select: { id: true, licenseNumber: true } }),
  ]);
  if (!job) return NextResponse.json({ error: "Linked job not found for this business" }, { status: 404 });
  if (!electrician) return NextResponse.json({ error: "Issuing electrician not found for this business or inactive" }, { status: 400 });
  if (!electrician.licenseNumber?.trim()) return NextResponse.json({ error: "Issuing electrician must have a licence number recorded" }, { status: 400 });

  try {
    const certificate = await prisma.certificate.create({ data: { certNumber: data.certNumber, type: data.type, jobId: data.jobId, electricianId: data.electricianId, issuedDate: data.issuedDate ? new Date(data.issuedDate) : null, status: data.status } });
    await recordAudit({ actor: user, action: "CERTIFICATE_CREATED", entityType: "Certificate", entityId: certificate.id, details: { businessId, certNumber: certificate.certNumber, type: certificate.type, jobId: certificate.jobId, electricianId: certificate.electricianId, status: certificate.status, issuedDate: certificate.issuedDate?.toISOString().slice(0, 10) ?? null } });
    return NextResponse.json(certificate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create certificate. Check the job, electrician, and certificate number." }, { status: 400 });
  }
}
