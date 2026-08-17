import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import CertificatesView, { type CertificateRow } from "@/components/CertificatesView";

export default async function CertificatesPage() {
  await requireAccess("certificates");

  const [certificateRows, jobs, electricians] = await Promise.all([
    prisma.certificate.findMany({
      include: {
        job: { select: { title: true, address: true } },
        electrician: { select: { name: true, licenseNumber: true } },
      },
      orderBy: [{ issuedDate: "desc" }, { certNumber: "asc" }],
    }),
    prisma.job.findMany({
      select: { id: true, title: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, licenseNumber: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const certificates: CertificateRow[] = certificateRows.map((certificate) => ({
    id: certificate.id,
    certNumber: certificate.certNumber,
    type: certificate.type,
    status: certificate.status,
    issuedDate: certificate.issuedDate?.toISOString() ?? null,
    jobTitle: certificate.job.title,
    jobAddress: certificate.job.address,
    electricianName: certificate.electrician.name,
    licenseNumber: certificate.electrician.licenseNumber,
  }));

  return (
    <CertificatesView
      certificates={certificates}
      jobs={jobs}
      electricians={electricians}
    />
  );
}
