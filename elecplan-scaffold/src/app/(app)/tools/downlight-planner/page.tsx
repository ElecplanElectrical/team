import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import DownlightPlanner from "@/components/DownlightPlanner";
import { requireAccess } from "@/lib/session";

export default async function DownlightPlannerPage() {
  await requireAccess("tools");

  return <>
    <div className="bg-[#0d1117] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#43D2FF]"><ChevronLeft size={16}/> Back to Tools</Link>
      </div>
    </div>
    <DownlightPlanner />
  </>;
}
