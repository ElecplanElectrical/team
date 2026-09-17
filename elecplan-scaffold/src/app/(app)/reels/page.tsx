import { requireAccess } from "@/lib/session";
import ReelsView from "@/components/ReelsView";

export default async function ReelsPage() {
  await requireAccess("reels");
  return <ReelsView ideas={[]} />;
}
