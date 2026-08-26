import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import ProjectsView from "@/components/ProjectsView";

export default async function ProjectsPage() {
  const user = await requireAccess("projects");
  const businessId = user.businessId ?? "__unassigned__";
  const [photos, jobs] = await Promise.all([
    prisma.projectPhoto.findMany({ where: { job: { businessId } }, orderBy: { uploadedAt: "desc" }, include: { job: { select: { title: true, address: true, client: { select: { name: true } } } } } }),
    prisma.job.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return <ProjectsView photos={photos.map((photo) => ({ id: photo.id, fileUrl: photo.fileUrl, uploadedAt: photo.uploadedAt.toISOString(), job: photo.job.title, address: photo.job.address, client: photo.job.client.name }))} jobs={jobs} canDelete={user.role !== "EMPLOYEE"} storageReady={storageConfigured()} canConfigureStorage={user.role === "ADMIN"} />;
}
