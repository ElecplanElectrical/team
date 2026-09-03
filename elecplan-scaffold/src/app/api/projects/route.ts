import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, verifyCommitToken } from "@/lib/storage";

const schema = z.object({ jobId: z.string().trim().min(1), commitToken: z.string().min(1) });
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "projects")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  if (req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const jobId = String(form?.get("jobId") ?? "").trim();
    if (!jobId || !(file instanceof File) || file.size <= 0) return NextResponse.json({ error: "Job and photo are required" }, { status: 400 });
    if (!PHOTO_TYPES.has(file.type)) return NextResponse.json({ error: "Photos must be JPG, PNG or WebP" }, { status: 400 });
    if (file.size > PHOTO_MAX_BYTES) return NextResponse.json({ error: `Photo is too large. Maximum is ${Math.floor(PHOTO_MAX_BYTES / 1024 / 1024)} MB.` }, { status: 400 });
    const job = await prisma.job.findFirst({ where: { id: jobId, businessId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 404 });
    const id = randomUUID();
    const photo = await prisma.projectPhoto.create({
      data: { id, jobId: job.id, fileUrl: `/api/projects/${id}/file`, originalName: file.name.slice(0, 200), contentType: file.type, sizeBytes: file.size, fileData: Buffer.from(await file.arrayBuffer()) },
      select: { id: true, jobId: true, fileUrl: true, originalName: true, contentType: true, sizeBytes: true, uploadedAt: true },
    });
    await recordAudit({ actor: user, action: "PROJECT_PHOTO_UPLOADED", entityType: "ProjectPhoto", entityId: photo.id, details: { businessId, jobId: job.id, contentType: file.type, sizeBytes: file.size, storage: "database" } });
    return NextResponse.json(photo, { status: 201 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Job and completed private photo upload are required" }, { status: 400 });
  const { jobId, commitToken } = parsed.data;
  const upload = verifyCommitToken(commitToken, "project-photos");
  if (!upload) return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });

  const job = await prisma.job.findFirst({ where: { id: jobId, businessId }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Job not found for this business" }, { status: 404 });

  const id = randomUUID();
  const photo = await prisma.projectPhoto.create({
    data: { id, jobId: job.id, fileUrl: `/api/projects/${id}/file`, storageKey: upload.key, originalName: upload.fileName, contentType: upload.contentType, sizeBytes: upload.sizeBytes },
    select: { id: true, jobId: true, fileUrl: true, storageKey: true, originalName: true, contentType: true, sizeBytes: true, uploadedAt: true },
  });
  await recordAudit({ actor: user, action: "PROJECT_PHOTO_UPLOADED", entityType: "ProjectPhoto", entityId: photo.id, details: { businessId, jobId: job.id, contentType: upload.contentType, sizeBytes: upload.sizeBytes } });
  return NextResponse.json(photo, { status: 201 });
}
