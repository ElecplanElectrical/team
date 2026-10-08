import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import DocumentsView from "@/components/DocumentsView";

export default async function DocumentsPage() {
  const user = await requireAccess("documents");

  const employeeJobScope = user.role === "EMPLOYEE"
    ? { OR: [{ assignedToId: user.id }, { crew: { some: { id: user.id } } }] }
    : {};

  const [documents, jobs] = await Promise.all([
    prisma.document.findMany({
      where: user.role === "EMPLOYEE"
        ? { job: { is: { ...employeeJobScope } } }
        : {},
      orderBy: { createdAt: "desc" },
      include: { job: { select: { id: true, title: true, address: true } } },
    }),
    prisma.job.findMany({
      where: employeeJobScope,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, address: true },
    }),
  ]);

  return (
    <DocumentsView
      documents={documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.kind ?? "General",
        fileUrl: doc.url,
        jobId: doc.job?.id ?? null,
        job: doc.job?.title ?? null,
        address: doc.job?.address ?? null,
        uploadedAt: doc.createdAt.toISOString(),
      }))}
      jobs={jobs}
      canDelete={user.role !== "EMPLOYEE"}
      storageReady={storageConfigured()}
      canConfigureStorage={user.role === "ADMIN"}
    />
  );
}
