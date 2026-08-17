import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "documents")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    name?: string;
    type?: string;
    fileUrl?: string;
    jobId?: string | null;
  } | null;

  const name = body?.name?.trim();
  const type = body?.type?.trim();
  const fileUrl = body?.fileUrl?.trim();
  const jobId = body?.jobId?.trim() || null;

  if (!name || !type || !fileUrl) {
    return NextResponse.json({ error: "Name, type and HTTPS file link are required" }, { status: 400 });
  }
  if (!validHttpsUrl(fileUrl)) {
    return NextResponse.json({ error: "Document link must use HTTPS" }, { status: 400 });
  }

  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: { name, type, fileUrl, jobId },
  });

  return NextResponse.json(document, { status: 201 });
}
