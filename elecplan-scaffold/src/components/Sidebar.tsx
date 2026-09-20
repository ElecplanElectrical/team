"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor, ROLE_TITLE, initialsOf } from "@/lib/nav";
import { LOGO_WORDMARK } from "@/lib/logo";

const UI = {
  sidebar: "radial-gradient(ellipse at 20% 0%,rgba(255,255,255,.16) 0%,rgba(255,255,255,.045) 20%,transparent 42%),linear-gradient(115deg,transparent 0 30%,rgba(255,255,255,.045) 42%,transparent 54%),linear-gradient(180deg,#11151A 0%,#050608 48%,#0A0D11 100%)",
  border: "rgba(67,210,255,.16)",
  text: "#ffffff",
  mute: "#c0c7d0",
  faint: "#747f8d",
  cyan: "#43d2ff",
};

export default function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const groups = navGroupsFor(role);

  return (
    <aside className="hidden md:flex md:w-[74px] xl:w-[220px] shrink-0 flex-col px-2.5 py-5 xl:px-3" style={{ background: UI.sidebar, borderRight: `1px solid ${UI.border}` }}>
      <Link href="/dashboard" className="mb-6 flex h-9 items-center px-2 xl:px-3" aria-label="Elecplan dashboard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }} />
      </Link>
      <nav className="flex-1 overflow-y-auto pr-0.5">
        {groups.map((group, gi) => (
          <div key={group.heading ?? gi} className="mb-4 flex flex-col gap-1">
            {group.heading && <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] xl:block" style={{ color: UI.faint }}>{group.heading}</p>}
            {group.items.map((item) => {
              const href = SCREEN_PATH[item.screen];
              const active = pathname === href || pathname.startsWith(href + "/");
              const Icon = item.icon;
              return <Link key={item.screen} href={href} title={item.label} className="group flex h-10 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium transition xl:justify-start xl:px-3" style={{ background: active ? "linear-gradient(135deg,#79E5FF 0%,#43D2FF 42%,#159ED1 100%)" : "transparent", color: active ? "#fff" : UI.mute, boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,.42),0 8px 24px rgba(67,210,255,.22)" : "none" }}><Icon size={17} strokeWidth={active ? 2.3 : 1.9} style={{ color: active ? UI.cyan : undefined }} /><span className="hidden truncate xl:inline">{item.label}</span></Link>;
            })}
          </div>
        ))}
      </nav>
      <div className="mt-4 border-t pt-3" style={{ borderColor: UI.border }}>
        <div className="flex items-center justify-center gap-2 rounded-xl px-1 py-2 xl:justify-start xl:px-2" style={{ background: "rgba(0,0,0,.16)" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "#202a34", border: `1px solid rgba(125,211,252,.32)`, color: "#e0f7ff" }}>{initialsOf(name)}</div>
          <div className="hidden min-w-0 flex-1 xl:block"><p className="truncate text-xs font-semibold" style={{ color: UI.text }}>{name}</p><p className="truncate text-[10px]" style={{ color: UI.faint }}>{ROLE_TITLE[role]}</p></div>
          <ChevronDown size={13} className="hidden xl:block" style={{ color: UI.faint }} />
        </div>
        <div className="mt-2 hidden items-center gap-1 xl:flex">
          <Link href={role === "ADMIN" ? "/settings" : "/account"} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{ color: UI.faint }}><Settings size={13} /> Settings</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-md p-1.5" style={{ color: UI.faint }} aria-label="Sign out"><LogOut size={13} /></button>
        </div>
      </div>
    </aside>
  );
}
