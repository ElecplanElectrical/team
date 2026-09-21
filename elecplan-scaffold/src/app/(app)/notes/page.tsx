import { prisma } from "@/lib/prisma";
import { requireAccess, requireUser } from "@/lib/session";
import NotesView from "@/components/NotesView";

export default async function NotesPage() {
  await requireAccess("notes");
  const user = await requireUser();
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return <NotesView notes={notes.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }))} />;
}
