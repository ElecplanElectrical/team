import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const DEFAULT_CONTENT = [{ id: "start", type: "text", text: "" }];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "notes")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = body?.title?.trim().slice(0, 160) || "New Note";

  const note = await prisma.note.create({
    data: { userId: user.id, title, content: DEFAULT_CONTENT },
  });

  return NextResponse.json({
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }, { status: 201 });
}
