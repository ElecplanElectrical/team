import ReviewsView from "@/components/ReviewsView";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

export default async function ReviewsPage() {
  const user = await requireAccess("reviews");
  const businessId = user.businessId ?? "__unassigned__";

  const [reviews, clients] = await Promise.all([
    prisma.review.findMany({
      where: { client: { businessId } },
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.client.findMany({ where: { businessId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <ReviewsView
      reviews={reviews.map((review) => ({
        id: review.id,
        client: review.client.name,
        rating: review.rating,
        text: review.text,
        source: review.source,
        createdAt: review.createdAt.toISOString(),
      }))}
      clients={clients}
    />
  );
}
