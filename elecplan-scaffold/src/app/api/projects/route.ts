import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "projects")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { jobId?: string; fileUrl?: string } | null;
  const jobId = body?.jobId?.trim();
  const fileUrl = body?.fileUrl?.trim();
  if (!jobId || !fileUrl) return NextResponse.json({ error: "Job and HTTPS photo link are required" }, { status: 400 });
  if (!validHttpsUrl(fileUrl)) return NextResponse.json({ error: "Photo link must use HTTPS" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });

  const photo = await prisma.projectPhoto.create({ data: { jobId, fileUrl } });
  return NextResponse.json(photo, { status: 201 });
}
