import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import DocumentsView from "@/components/DocumentsView";

export default async function DocumentsPage() {
  const user = await requireAccess("documents");
  const businessId = user.businessId ?? "__unassigned__";

  const [documents, jobs] = await Promise.all([
    prisma.document.findMany({
      where: { businessId },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, name: true, type: true, fileUrl: true, uploadedAt: true, job: { select: { title: true } } },
    }),
    prisma.job.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <DocumentsView
      documents={documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        fileUrl: doc.fileUrl,
        job: doc.job?.title ?? null,
        uploadedAt: doc.uploadedAt.toISOString(),
      }))}
      jobs={jobs}
      canDelete={user.role !== "EMPLOYEE"}
      storageReady={storageConfigured()}
    />
  );
}
