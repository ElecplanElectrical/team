"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor, ROLE_TITLE, initialsOf } from "@/lib/nav";
import { LOGO_MARK } from "@/lib/logo";

const UI = {
  sidebar: "linear-gradient(180deg,#02101f 0%,#031321 100%)",
  border: "rgba(73,145,214,.22)",
  text: "#f4f8ff",
  mute: "#9aacc2",
  faint: "#58718c",
  cyan: "#25c7ff",
};

export default function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const groups = navGroupsFor(role);
  const accountHref = role === "ADMIN" ? "/settings" : "/account";

  return (
    <aside className="hidden shrink-0 flex-col px-2.5 py-5 md:flex md:w-[74px] xl:w-[220px] xl:px-3" style={{ background: UI.sidebar, borderRight: `1px solid ${UI.border}` }}>
      <Link href="/dashboard" className="mb-6 flex h-11 items-center justify-center xl:justify-start xl:px-2" aria-label="Elecplan dashboard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_MARK}
          alt="Elecplan"
          className="h-10 w-10 rounded-full object-contain xl:h-11 xl:w-11"
          style={{ display: "block", boxShadow: "0 8px 24px rgba(0,0,0,.22)" }}
        />
      </Link>

      <nav className="flex-1 overflow-y-auto pr-0.5" aria-label="Elecplan navigation">
        {groups.map((group, gi) => (
          <div key={group.heading ?? gi} className="mb-4 flex flex-col gap-1">
            {group.heading && <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] xl:block" style={{ color: UI.faint }}>{group.heading}</p>}
            {group.items.map((item) => {
              const href = SCREEN_PATH[item.screen];
              const active = pathname === href || pathname.startsWith(href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.screen}
                  href={href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className="group flex h-10 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium xl:justify-start xl:px-3"
                  style={{
                    background: active ? "linear-gradient(90deg,rgba(17,112,255,.55),rgba(19,93,205,.18))" : "transparent",
                    color: active ? "#fff" : UI.mute,
                    boxShadow: active ? "inset 0 0 0 1px rgba(38,145,255,.2),0 6px 20px rgba(0,78,190,.12)" : "none",
                  }}
                >
                  <Icon size={17} strokeWidth={active ? 2.3 : 1.9} style={{ color: active ? UI.cyan : undefined }} />
                  <span className="hidden truncate xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-4 border-t pt-3" style={{ borderColor: UI.border }}>
        <Link
          href={accountHref}
          className="flex items-center justify-center gap-2 rounded-xl px-1 py-2 xl:justify-start xl:px-2"
          style={{ background: "rgba(8,28,48,.72)", border: "1px solid rgba(73,145,214,.10)" }}
          aria-label="Open account settings"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "#0b2b4c", border: `1px solid rgba(37,199,255,.28)`, color: "#d9f5ff" }}>{initialsOf(name)}</div>
          <div className="hidden min-w-0 flex-1 xl:block"><p className="truncate text-xs font-semibold" style={{ color: UI.text }}>{name}</p><p className="truncate text-[10px]" style={{ color: UI.faint }}>{ROLE_TITLE[role]}</p></div>
        </Link>

        <div className="mt-2 hidden items-center gap-1 xl:flex">
          <Link href={accountHref} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: UI.faint }}><Settings size={13} /> Settings</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-md p-1.5" style={{ color: UI.faint }} aria-label="Sign out"><LogOut size={13} /></button>
        </div>
      </div>
    </aside>
  );
}
