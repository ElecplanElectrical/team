import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import DocumentsView from "@/components/DocumentsView";

export default async function DocumentsPage() {
  const user = await requireAccess("documents");

  const [documents, jobs] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { job: { select: { title: true } } },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <DocumentsView
      documents={documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.kind ?? "General",
        fileUrl: doc.url,
        job: doc.job?.title ?? null,
        uploadedAt: doc.createdAt.toISOString(),
      }))}
      jobs={jobs}
      canDelete={user.role !== "EMPLOYEE"}
      storageReady={storageConfigured()}
      canConfigureStorage={user.role === "ADMIN"}
    />
  );
}
