import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import JobDetailView from "@/components/JobDetailView";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, contactName: true, phone: true } },
      assignedTo: { select: { id: true, name: true } },
      photos: { orderBy: { uploadedAt: "desc" }, select: { id: true, originalName: true, uploadedAt: true } },
    },
  });
  if (!job) notFound();
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id) notFound();

  return <JobDetailView job={{
    id: job.id,
    title: job.title,
    address: job.address,
    notes: job.notes,
    status: job.status,
    scheduledStart: job.scheduledStart?.toISOString() ?? null,
    scheduledEnd: job.scheduledEnd?.toISOString() ?? null,
    client: job.client,
    assignedTo: job.assignedTo,
    photoCount: job.photos.length,
  }} />;
}
