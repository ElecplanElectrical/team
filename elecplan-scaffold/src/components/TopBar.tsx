import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";

const UI = {
  bg: "rgba(3,16,31,.94)",
  panel: "#081b30",
  border: "rgba(77,150,221,.23)",
  text: "#f6f9ff",
  mute: "#8fa5bf",
  blue: "#168dff",
};

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
      className="shrink-0 px-4 py-4 md:px-6 xl:px-7"
      style={{
        background: UI.bg,
        borderBottom: `1px solid ${UI.border}`,
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-[-0.02em] md:text-2xl" style={{ color: UI.text }}>
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 truncate text-xs md:text-sm" style={{ color: UI.mute }}>{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden lg:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.mute }} />
            <input
              aria-label="Search"
              placeholder="Search jobs, clients, quotes..."
              className="h-10 w-60 rounded-lg bg-transparent pl-9 pr-3 text-xs outline-none xl:w-72"
              style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text }}
            />
          </div>
          {rightSlot}
          <Link
            href="/jobs"
            aria-label="Open jobs"
            className="hidden h-10 w-10 items-center justify-center rounded-lg sm:flex"
            style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}
          >
            <Plus size={18} />
          </Link>
          <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#081b30]" />
          </button>
          <div className="hidden h-10 w-10 items-center justify-center rounded-full text-xs font-semibold sm:flex" style={{ background: "linear-gradient(145deg,#0d3154,#071a2d)", border: `1px solid rgba(37,199,255,.35)`, color: "#d9f5ff" }}>
            EP
          </div>
        </div>
      </div>
    </header>
  );
}
