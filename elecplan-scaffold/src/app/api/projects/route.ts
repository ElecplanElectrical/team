import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { verifyCommitToken } from "@/lib/storage";

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  jobId: z.string().trim().min(1).optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

const legacyPhotoSchema = z.object({ jobId: z.string().trim().min(1), commitToken: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "projects")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const legacy = legacyPhotoSchema.safeParse(body);
  if (legacy.success) {
    const upload = verifyCommitToken(legacy.data.commitToken, "project-photos");
    if (!upload) return NextResponse.json({ error: "Upload ticket is invalid or expired" }, { status: 400 });
    const job = await prisma.job.findUnique({ where: { id: legacy.data.jobId }, select: { id: true, assignedToId: true, crew: { select: { id: true } } } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });
    if (user.role === "EMPLOYEE" && job.assignedToId !== user.id && !job.crew.some((member) => member.id === user.id)) return NextResponse.json({ error: "This job is not assigned to you" }, { status: 403 });
    const id = randomUUID();
    const photo = await prisma.projectPhoto.create({ data: { id, jobId: job.id, url: `/api/projects/${id}/file`, storageKey: upload.key, mimeType: upload.contentType, sizeBytes: upload.sizeBytes } });
    await recordAudit({ actor: user, action: "PROJECT_PHOTO_UPLOADED", entityType: "ProjectPhoto", entityId: photo.id, details: { jobId: job.id, contentType: upload.contentType, sizeBytes: upload.sizeBytes } });
    return NextResponse.json(photo, { status: 201 });
  }

  if (user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can create past projects" }, { status: 403 });
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  const data = parsed.data;
  let job: { id:string;title:string;address:string;scheduledEnd:Date|null } | null = null;
  if (data.jobId) {
    job = await prisma.job.findUnique({ where: { id: data.jobId }, select: { id:true,title:true,address:true,scheduledEnd:true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });
  }
  const project = await prisma.project.create({ data: {
    name: data.name || job?.title || "Past project",
    description: data.description || null,
    address: data.address || job?.address || null,
    jobId: job?.id || null,
    completedAt: data.completedAt ? new Date(data.completedAt) : job?.scheduledEnd || new Date(),
  }});
  await recordAudit({ actor:user, action:"PAST_PROJECT_CREATED", entityType:"Project", entityId:project.id, details:{ jobId:project.jobId, name:project.name } });
  return NextResponse.json(project, { status:201 });
}
