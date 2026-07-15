import { Search, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { COLORS, FONTS } from "@/lib/theme";

export default function TopBar({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 shrink-0"
      style={{
        background: COLORS.bg,
        borderBottom: `1px solid ${COLORS.borderSoft}`,
      }}
    >
      <div className="min-w-0">
        <h1
          className="text-base md:text-xl font-semibold truncate"
          style={{ fontFamily: FONTS.display, color: COLORS.text }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs md:text-sm truncate"
            style={{ color: COLORS.textMute }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {rightSlot}
        <IconButton label="Search">
          <Search size={16} style={{ color: COLORS.textMute }} />
        </IconButton>
        <div className="relative">
          <IconButton label="Notifications">
            <Bell size={16} style={{ color: COLORS.textMute }} />
          </IconButton>
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: COLORS.coral }}
          />
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="hidden sm:flex w-9 h-9 items-center justify-center rounded-md"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </button>
  );
}
