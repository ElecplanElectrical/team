"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor } from "@/lib/nav";
import { LOGO_WORDMARK } from "@/lib/logo";

const UI = {
  bg: "rgba(2,14,27,.97)",
  panel: "#07192b",
  border: "rgba(73,145,214,.22)",
  mute: "#93a8c1",
  cyan: "#25c7ff",
};

export default function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const groups = navGroupsFor(role);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-4 md:hidden" style={{ background: UI.bg, borderBottom: `1px solid ${UI.border}`, backdropFilter: "blur(16px)" }}>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>
          <Menu size={18} />
        </button>
        <Link href="/dashboard" aria-label="Elecplan dashboard" className="flex h-9 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 112, height: "auto", objectFit: "contain", display: "block" }} />
        </Link>
        <Link href="/reminders" aria-label="Open reminders" className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>
          <Bell size={16} />
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[330px] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl" style={{ background: "linear-gradient(180deg,#02101f,#031321)", borderRight: `1px solid ${UI.border}` }}>
            <div className="mb-6 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 126, height: "auto", objectFit: "contain", display: "block" }} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><X size={17} /></button>
            </div>
            <nav className="space-y-5" aria-label="Elecplan sections">
              {groups.map((group, gi) => (
                <div key={group.heading ?? gi}>
                  {group.heading && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.13em]" style={{ color: "#58718c" }}>{group.heading}</p>}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const href = SCREEN_PATH[item.screen];
                      const active = pathname === href || pathname.startsWith(href + "/");
                      const Icon = item.icon;
                      return (
                        <Link key={item.screen} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ background: active ? "linear-gradient(90deg,rgba(17,112,255,.58),rgba(19,93,205,.18))" : "transparent", color: active ? "#f4f8ff" : UI.mute }} aria-current={active ? "page" : undefined}>
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
