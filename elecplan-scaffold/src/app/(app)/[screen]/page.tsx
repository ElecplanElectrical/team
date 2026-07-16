import { notFound } from "next/navigation";
import ComingSoon from "@/components/ComingSoon";
import { requireAccess } from "@/lib/session";
import { screenForPath, type Screen } from "@/lib/access";

// Which build phase each not-yet-built screen belongs to (from the spec).
const PHASE: Partial<Record<Screen, string>> = {
  quotes: "Phase 2 (Money)",
  bills: "Phase 2 (Money)",
  dashboard: "Phase 2 (Money)",
  certificates: "Phase 3 (Compliance)",
  inspections: "Phase 3 (Compliance)",
  materials: "Phase 3 (Compliance)",
  timesheets: "Phase 3 (Compliance)",
  documents: "Phase 4 (Comms)",
  projects: "Phase 4 (Comms)",
  leads: "Phase 5",
  reminders: "Phase 5",
  reviews: "Phase 5",
  reels: "Phase 5",
  analytics: "Phase 5",
};

export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen: segment } = await params;
  const screen = screenForPath("/" + segment);

  // Calendar, Jobs, Clients and Employees have real routes; unknown 404s.
  if (
    !screen ||
    screen === "calendar" ||
    screen === "timelines" ||
    screen === "clients" ||
    screen === "employees"
  ) {
    notFound();
  }

  await requireAccess(screen);

  const title = segment.charAt(0).toUpperCase() + segment.slice(1);
  return <ComingSoon title={title} phase={PHASE[screen]} />;
}
