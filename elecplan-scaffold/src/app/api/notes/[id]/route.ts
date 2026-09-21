import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const ALLOWED_TYPES = new Set(["text", "bullets", "table"]);

function cleanContent(value: unknown) {
  if (!Array.isArray(value)) return null;
  const blocks = value.slice(0, 200).map((raw) => {
    if (!raw || typeof raw !== "object") return null;
    const block = raw as Record<string, unknown>;
    const type = typeof block.type === "string" && ALLOWED_TYPES.has(block.type) ? block.type : null;
    if (!type) return null;
    const id = typeof block.id === "string" ? block.id.slice(0, 80) : crypto.randomUUID();

    if (type === "text") {
      return { id, type, text: typeof block.text === "string" ? block.text.slice(0, 50000) : "" };
    }

    if (type === "bullets") {
      const items = Array.isArray(block.items)
        ? block.items.slice(0, 200).map(item => typeof item === "string" ? item.slice(0, 2000) : "")
        : [""];
      return { id, type, items: items.length ? items : [""] };
    }

    const rows = Array.isArray(block.rows)
      ? block.rows.slice(0, 50).map(row => Array.isArray(row) ? row.slice(0, 12).map(cell => typeof cell === "string" ? cell.slice(0, 2000) : "") : [])
      : [["", ""], ["", ""]];
    return { id, type, rows: rows.length ? rows : [["", ""], ["", ""]] };
  }).filter(Boolean);

  return blocks.length ? blocks : [{ id: crypto.randomUUID(), type: "text", text: "" }];
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "notes")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.note.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const body = await req.json().catch(() => null) as { title?: unknown; content?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Invalid note" }, { status: 400 });

  const data: { title?: string; content?: NonNullable<ReturnType<typeof cleanContent>> } = {};
  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 160) || "Untitled Note";
  if ("content" in body) {
    const content = cleanContent(body.content);
    if (!content) return NextResponse.json({ error: "Invalid note content" }, { status: 400 });
    data.content = content;
  }

  const note = await prisma.note.update({ where: { id }, data });
  return NextResponse.json({
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "notes")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.note.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
