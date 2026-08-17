import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  certNumber: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(120),
  jobId: z.string().cuid(),
  electricianId: z.string().cuid(),
  issuedDate: z.string().datetime().optional().nullable(),
  status: z.enum(["PENDING", "ISSUED", "EXPIRING"]),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can manage certificates" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid certificate details", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  try {
    const certificate = await prisma.certificate.create({
      data: {
        certNumber: data.certNumber,
        type: data.type,
        jobId: data.jobId,
        electricianId: data.electricianId,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
        status: data.status,
      },
    });
    return NextResponse.json(certificate, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create certificate. Check the job, electrician, and certificate number." },
      { status: 400 },
    );
  }
}
