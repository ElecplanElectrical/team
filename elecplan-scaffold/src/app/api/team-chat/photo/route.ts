import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "teamChat")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size <= 0) return NextResponse.json({ error: "Photo is required" }, { status: 400 });
  if (!PHOTO_TYPES.has(file.type)) return NextResponse.json({ error: "Photos must be JPG, PNG or WebP" }, { status: 400 });
  if (file.size > PHOTO_MAX_BYTES) return NextResponse.json({ error: `Photo is too large. Maximum is ${Math.floor(PHOTO_MAX_BYTES / 1024 / 1024)} MB.` }, { status: 400 });

  const id = randomUUID();
  const document = await prisma.document.create({
    data: {
      id,
      businessId: user.businessId,
      name: file.name.slice(0, 200) || "Team chat photo",
      type: "TEAM_CHAT_PHOTO",
      fileUrl: `/api/documents/${id}/file`,
      originalName: file.name.slice(0, 200),
      contentType: file.type,
      sizeBytes: file.size,
      fileData: Buffer.from(await file.arrayBuffer()),
    },
    select: { id: true, fileUrl: true },
  });

  await recordAudit({ actor: user, action: "TEAM_CHAT_PHOTO_UPLOADED", entityType: "Document", entityId: document.id, details: { businessId: user.businessId, contentType: file.type, sizeBytes: file.size } });
  return NextResponse.json({ id: document.id, url: document.fileUrl }, { status: 201 });
}
