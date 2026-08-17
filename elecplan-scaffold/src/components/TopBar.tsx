import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { LOGO_WORDMARK } from "@/lib/logo";

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
      className="relative shrink-0 px-4 py-4 md:px-6 xl:px-7"
      style={{
        background: UI.bg,
        borderBottom: `1px solid ${UI.border}`,
        backdropFilter: "blur(18px)",
      }}
    >
      <Link
        href="/dashboard"
        className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center md:flex"
        aria-label="Elecplan dashboard"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_WORDMARK}
          alt="elecplan"
          className="h-auto w-[118px] object-contain lg:w-[132px] xl:w-[148px]"
          style={{ display: "block" }}
        />
      </Link>

      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4">
        <div className="min-w-0 md:max-w-[34%] xl:max-w-[38%]">
          <h1 className="truncate text-xl font-semibold tracking-[-0.02em] md:text-2xl" style={{ color: UI.text }}>
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 truncate text-xs md:text-sm" style={{ color: UI.mute }}>{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:max-w-[34%] xl:max-w-[38%]">
          <Link
            href="/jobs"
            className="hidden h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium lg:flex"
            style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}
            aria-label="Open jobs search"
          >
            <Search size={15} />
            <span className="hidden xl:inline">Search jobs</span>
          </Link>

          {rightSlot}

          <Link
            href="/jobs"
            aria-label="Open jobs"
            className="hidden h-10 w-10 items-center justify-center rounded-lg sm:flex"
            style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}
          >
            <Plus size={18} />
          </Link>

          <Link
            href="/reminders"
            aria-label="Open reminders"
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}
          >
            <Bell size={17} />
          </Link>

          <Link
            href="/account"
            aria-label="Open account"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-xs font-semibold sm:flex"
            style={{ background: "linear-gradient(145deg,#0d3154,#071a2d)", border: `1px solid rgba(37,199,255,.35)`, color: "#d9f5ff" }}
          >
            EP
          </Link>
        </div>
      </div>
    </header>
  );
}
