"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor } from "@/lib/nav";

const UI = {
  bg: "rgba(2,14,27,.97)",
  panel: "#07192b",
  border: "rgba(73,145,214,.22)",
  text: "#f4f8ff",
  mute: "#93a8c1",
  blue: "#168dff",
  cyan: "#25c7ff",
};

export default function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = navGroupsFor(role);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-4 md:hidden" style={{ background: UI.bg, borderBottom: `1px solid ${UI.border}`, backdropFilter: "blur(16px)" }}>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>
          <Menu size={18} />
        </button>
        <Link href="/dashboard" className="text-lg font-semibold tracking-[-0.05em]" style={{ color: UI.text }}>
          <span style={{ color: UI.cyan }}>elec</span>plan
        </Link>
        <button type="button" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] overflow-y-auto p-4 shadow-2xl" style={{ background: "linear-gradient(180deg,#02101f,#031321)", borderRight: `1px solid ${UI.border}` }}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xl font-semibold tracking-[-0.05em]" style={{ color: UI.text }}><span style={{ color: UI.cyan }}>elec</span>plan</span>
              <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><X size={17} /></button>
            </div>
            <nav className="space-y-5">
              {groups.map((group, gi) => (
                <div key={group.heading ?? gi}>
                  {group.heading && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.13em]" style={{ color: "#58718c" }}>{group.heading}</p>}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const href = SCREEN_PATH[item.screen];
                      const active = pathname === href || pathname.startsWith(href + "/");
                      const Icon = item.icon;
                      return (
                        <Link key={item.screen} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ background: active ? "linear-gradient(90deg,rgba(17,112,255,.58),rgba(19,93,205,.18))" : "transparent", color: active ? UI.text : UI.mute }}>
                          <Icon size={17} style={{ color: active ? UI.cyan : undefined }} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
