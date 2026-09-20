import { ArrowLeft, Wrench } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/TopBar";

import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase?: string;
}) {
  return (
    <>
      <TopBar title={title} subtitle="This area is not available yet" />
      <div className="flex flex-1 items-center justify-center overflow-auto p-4 md:p-8" style={{ background: "var(--ep-main)" }}>
        <section className="w-full max-w-lg rounded-2xl p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,.22)] md:p-8" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan, border: "1px solid rgba(67,210,255,.20)" }}>
            <Wrench size={21} />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: UI.cyan }}>Elecplan workspace</p>
          <h2 className="mt-2 text-xl font-semibold" style={{ color: UI.text }}>{title} is still being prepared</h2>
          <p className="mt-3 text-sm leading-6" style={{ color: UI.mute }}>
            {phase ? `This area belongs to ${phase}.` : "This route is reserved for a later Elecplan workflow."} Nothing here is required for the current operational tools.
          </p>
          <div className="mt-6 rounded-xl p-3 text-xs leading-5" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.faint }}>
            Use the navigation to return to the live Elecplan screens. This placeholder will be replaced when the workflow is ready.
          </div>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ ...UI.primary, color: UI.activeText }}>
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </section>
      </div>
    </>
  );
}
