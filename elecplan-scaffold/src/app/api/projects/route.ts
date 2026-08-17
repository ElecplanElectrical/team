import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({
  jobId: z.string().trim().min(1),
  commitToken: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "projects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Job and completed private photo upload are required" }, { status: 400 });
  }

  const { jobId, commitToken } = parsed.data;
  const upload = verifyCommitToken(commitToken, "project-photos");
  if (!upload) {
    return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });

  const id = randomUUID();
  const photo = await prisma.projectPhoto.create({
    data: {
      id,
      jobId,
      fileUrl: `/api/projects/${id}/file`,
      storageKey: upload.key,
      originalName: upload.fileName,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
    },
  });

  await recordAudit({
    actor: user,
    action: "PROJECT_PHOTO_UPLOADED",
    entityType: "ProjectPhoto",
    entityId: photo.id,
    details: { jobId, contentType: upload.contentType, sizeBytes: upload.sizeBytes },
  });

  return NextResponse.json(photo, { status: 201 });
}
