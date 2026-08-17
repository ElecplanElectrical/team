import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import ProjectsView from "@/components/ProjectsView";

export default async function ProjectsPage() {
  const user = await requireAccess("projects");
  const [photos, jobs] = await Promise.all([
    prisma.projectPhoto.findMany({ orderBy: { uploadedAt: "desc" }, include: { job: { select: { title: true, address: true, client: { select: { name: true } } } } } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return <ProjectsView photos={photos.map((photo) => ({ id: photo.id, fileUrl: photo.fileUrl, uploadedAt: photo.uploadedAt.toISOString(), job: photo.job.title, address: photo.job.address, client: photo.job.client.name }))} jobs={jobs} canDelete={user.role !== "EMPLOYEE"} />;
}
