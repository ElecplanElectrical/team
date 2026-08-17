import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import InspectionsView, { type InspectionRow } from "@/components/InspectionsView";

export default async function InspectionsPage() {
  await requireAccess("inspections");

  const [inspectionRows, jobs] = await Promise.all([
    prisma.inspection.findMany({
      include: { job: { select: { title: true, address: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.job.findMany({
      select: { id: true, title: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const inspections: InspectionRow[] = inspectionRows.map((inspection) => ({
    id: inspection.id,
    type: inspection.type,
    status: inspection.status,
    date: inspection.date.toISOString(),
    jobTitle: inspection.job.title,
    jobAddress: inspection.job.address,
  }));

  return <InspectionsView inspections={inspections} jobs={jobs} />;
}
