import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import InspectionsView, { type InspectionRow } from "@/components/InspectionsView";

export default async function InspectionsPage() {
  const user = await requireAccess("inspections");
  const businessId = user.businessId ?? "__unassigned__";

  const [inspectionRows, jobs] = await Promise.all([
    prisma.inspection.findMany({
      where: { businessId },
      include: { job: { select: { title: true, address: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.job.findMany({
      where: { businessId },
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
