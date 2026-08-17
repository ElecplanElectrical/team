import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ReelsView from "@/components/ReelsView";

export default async function ReelsPage() {
  await requireAccess("reels");

  const ideas = await prisma.reelIdea.findMany({ orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }] });

  return <ReelsView ideas={ideas.map((idea) => ({
    ...idea,
    scheduledAt: idea.scheduledAt?.toISOString() ?? null,
    createdAt: idea.createdAt.toISOString(),
  }))} />;
}
