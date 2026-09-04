"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, BriefcaseBusiness, CircleUserRound, FileText, Plus, Search, UsersRound } from "lucide-react";

const UI = { bg: "color-mix(in srgb, var(--brand-panel, #081b30) 88%, #020705)", panel: "var(--brand-panel, #081b30)", border: "var(--brand-border, rgba(77,150,221,.23))", text: "#f6f9ff", mute: "var(--brand-muted, #8fa5bf)", blue: "var(--brand-primary, #168dff)" };

type SearchResult = { id: string; type: "job" | "client" | "quote"; title: string; detail: string; href: string };
const RESULT_ICON = { job: BriefcaseBusiness, client: UsersRound, quote: FileText } as const;

export default function TopBar({ title, subtitle, rightSlot }: { title: string; subtitle?: string; rightSlot?: ReactNode }) {
  const searchWrap = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => null) as { results?: SearchResult[] } | null;
        if (response.ok) setResults(data?.results ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    function closeSearch(event: PointerEvent) {
      if (!searchWrap.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, []);

  return <header className="shrink-0 px-4 py-4 md:px-6 xl:px-7" style={{ background: UI.bg, borderBottom: `1px solid ${UI.border}`, backdropFilter: "blur(18px)" }}>
    <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em] md:text-2xl" style={{ color: UI.text }}>{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs md:text-sm" style={{ color: UI.mute }}>{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div ref={searchWrap} className="relative hidden lg:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.mute }} />
          <input
            aria-label="Search jobs, clients and quotes"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setOpen(true);
              if (value.trim().length < 2) { setResults([]); setSearching(false); }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Enter" && results[0]) window.location.assign(results[0].href);
            }}
            placeholder="Search jobs, clients, quotes…"
            className="h-10 w-60 rounded-lg bg-transparent pl-9 pr-3 text-xs outline-none xl:w-72"
            style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text }}
          />
          {open && query.trim().length >= 2 && <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl shadow-2xl" style={{ background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}` }}>
            {searching ? <p className="px-4 py-5 text-center text-xs" style={{ color: UI.mute }}>Searching…</p> : results.length ? results.map((result) => { const Icon=RESULT_ICON[result.type]; return <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => setOpen(false)} className="flex items-center gap-3 border-b px-3 py-3 last:border-0" style={{ borderColor: UI.border }}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .12)", color: "var(--brand-accent, #25c7ff)" }}><Icon size={15}/></span><span className="min-w-0"><span className="block truncate text-xs font-semibold" style={{ color: UI.text }}>{result.title}</span><span className="mt-0.5 block truncate text-[10px] capitalize" style={{ color: UI.mute }}>{result.type} · {result.detail}</span></span></Link>; }) : <p className="px-4 py-5 text-center text-xs" style={{ color: UI.mute }}>No matching jobs, clients or quotes.</p>}
          </div>}
        </div>
        {rightSlot}
        <Link href="/jobs" aria-label="Open jobs" className="hidden h-10 w-10 items-center justify-center rounded-lg sm:flex" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px var(--brand-glow, rgb(var(--brand-primary-rgb, 22 141 255) / .25))" }}><Plus size={18} /></Link>
        <Link href="/notifications" aria-label="Open notifications" className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><Bell size={17} /></Link>
        <Link href="/account" aria-label="Open account" className="hidden h-10 w-10 items-center justify-center rounded-full sm:flex" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: "var(--brand-accent, #25c7ff)" }}><CircleUserRound size={19}/></Link>
      </div>
    </div>
  </header>;
}
