import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(80),
  jobId: z.string().trim().min(1).nullable().optional(),
  commitToken: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "documents")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Document name, type and completed private upload are required" }, { status: 400 });
  }

  const { name, type, jobId = null, commitToken } = parsed.data;
  const upload = verifyCommitToken(commitToken, "documents");
  if (!upload) {
    return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });
  }

  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });
  }

  const id = randomUUID();
  const document = await prisma.document.create({
    data: {
      id,
      name,
      type,
      jobId,
      fileUrl: `/api/documents/${id}/file`,
      storageKey: upload.key,
      originalName: upload.fileName,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
    },
  });

  await recordAudit({
    actor: user,
    action: "DOCUMENT_UPLOADED",
    entityType: "Document",
    entityId: document.id,
    details: { jobId, contentType: upload.contentType, sizeBytes: upload.sizeBytes },
  });

  return NextResponse.json(document, { status: 201 });
}
