import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ReelsView from "@/components/ReelsView";

export default async function ReelsPage() {
  const user = await requireAccess("reels");
  const businessId = user.businessId ?? "__unassigned__";

  const ideas = await prisma.reelIdea.findMany({
    where: { businessId },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return <ReelsView ideas={ideas.map((idea) => ({
    ...idea,
    scheduledAt: idea.scheduledAt?.toISOString() ?? null,
    createdAt: idea.createdAt.toISOString(),
  }))} />;
}
