"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronRight, LogOut, Search, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor, ROLE_TITLE, initialsOf } from "@/lib/nav";
import { LOGO_WORDMARK } from "@/lib/logo";

/** Both navigation surfaces render the approved #10 structure, not an imitation. */
export default function CarbonNavigation({ role, name, onNavigate }: {
  role: Role; name: string; onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => navGroupsFor(role).map(group => ({
    ...group, items: group.items.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter(group => group.items.length > 0), [role, query]);
  return <div className="ep-carbon-navigation">
    <Link href="/dashboard" className="ep-carbon-brand" aria-label="Elecplan dashboard" onClick={onNavigate}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_WORDMARK} alt="elecplan" />
    </Link>
    <label className="ep-carbon-search"><Search aria-hidden="true" />
      <input type="search" aria-label="Find a menu page" placeholder="Find a page..." value={query} onChange={event => setQuery(event.target.value)} />
    </label>
    <nav className="ep-carbon-nav" aria-label="Elecplan navigation">
      {groups.map((group, index) => <div key={group.heading ?? index} className="ep-carbon-group">
        {group.heading && <p className="ep-carbon-heading">{group.heading}</p>}
        {group.items.map(item => {
          const href = SCREEN_PATH[item.screen];
          const active = pathname === href || pathname.startsWith(href + "/");
          const Icon = item.icon;
          return <Link key={item.screen} href={href} title={item.label} aria-current={active ? "page" : undefined} className="ep-carbon-link" onClick={onNavigate}>
            <Icon className="ep-carbon-icon" aria-hidden="true" strokeWidth={active ? 2.3 : 1.9} />
            <span className="ep-carbon-label">{item.label}</span>
            {active && <ChevronRight className="ep-carbon-arrow" aria-hidden="true" />}
          </Link>;
        })}
      </div>)}
      {groups.length === 0 && <p className="ep-carbon-empty">No matching pages.</p>}
    </nav>
    <div className="ep-carbon-account">
      <div className="ep-carbon-avatar">{initialsOf(name)}</div>
      <div className="ep-carbon-identity"><strong>{name}</strong><small>{ROLE_TITLE[role]}</small></div>
      <div className="ep-carbon-account-actions">
        <Link href={role === "ADMIN" ? "/settings" : "/account"} aria-label="Settings" title="Settings" onClick={onNavigate}><Settings size={15} /></Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" title="Sign out"><LogOut size={15} /></button>
      </div>
    </div>
  </div>;
}
