import { Wrench } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS } from "@/lib/theme";

export default function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase?: string;
}) {
  return (
    <>
      <TopBar title={title} subtitle="Not built yet" />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
        <div
          className="rounded-lg p-8 max-w-md w-full text-center flex flex-col items-center gap-3"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: COLORS.accentDim }}
          >
            <Wrench size={22} style={{ color: COLORS.accent }} />
          </div>
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: FONTS.display, color: COLORS.text }}
          >
            {title} — coming soon
          </h2>
          <p className="text-sm" style={{ color: COLORS.textMute }}>
            This screen is part of {phase ?? "a later build phase"}. Phase 1
            ships authentication, the Calendar, and Jobs.
          </p>
        </div>
      </div>
    </>
  );
}
