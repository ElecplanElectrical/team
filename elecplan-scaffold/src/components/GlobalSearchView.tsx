"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, MapPin, Search, UserRound } from "lucide-react";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

type SiteResult = {
  jobId: string;
  address: string;
  jobCount: number;
  latestTitle: string;
  latestStatus: string;
  clients: string[];
};

type ClientResult = {
  id: string;
  name: string;
  contactName: string | null;
  address: string | null;
  phone: string | null;
};

export default function GlobalSearchView() {
  const [query, setQuery] = useState("");
  const [sites, setSites] = useState<SiteResult[]>([]);
  const [clients, setClients] = useState<ClientResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setSites(data.sites ?? []);
          setClients(data.clients ?? []);
        }
      } catch {
        // Expected when a new keystroke cancels the previous request.
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const empty = query.trim().length >= 2 && !loading && sites.length === 0 && clients.length === 0;

  return <div className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "var(--ep-main)" }}>
    <div className="mx-auto max-w-4xl">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: UI.cyan }} />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim().length < 2) {
              setSites([]);
              setClients([]);
            }
          }}
          placeholder="Search address, job or client…"
          className="h-14 w-full rounded-2xl pl-12 pr-4 text-base outline-none"
          style={{ ...UI.inset, background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text }}
        />
      </div>

      <p className="mt-2 px-1 text-xs" style={{ color: UI.faint }}>Search an address to open the complete property file: jobs, time, materials, photos, documents and people.</p>

      {loading && <div className="mt-5 rounded-2xl p-5 text-sm" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>Searching Elecplan…</div>}

      {sites.length > 0 && <section className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[.12em]" style={{ color: UI.cyan }}>Addresses / property files</h2>
        <div className="space-y-3">
          {sites.map((site) => <Link key={site.jobId + site.address} href={`/sites/${site.jobId}`} className="flex items-center gap-4 rounded-2xl p-4 transition hover:brightness-110" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.10)", color: UI.cyan }}><MapPin size={20} /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold md:text-base" style={{ color: UI.text }}>{site.address}</p>
              <p className="mt-1 truncate text-xs" style={{ color: UI.mute }}>{site.clients.join(", ")} · {site.jobCount} job{site.jobCount === 1 ? "" : "s"} · {site.latestTitle}</p>
            </div>
            <ChevronRight className="shrink-0" size={18} style={{ color: UI.cyan }} />
          </Link>)}
        </div>
      </section>}

      {clients.length > 0 && <section className="mt-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[.12em]" style={{ color: UI.cyan }}>Clients</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((client) => <Link key={client.id} href="/clients" className="rounded-2xl p-4" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex items-center gap-3"><UserRound size={18} style={{ color: UI.cyan }} /><p className="font-semibold" style={{ color: UI.text }}>{client.name}</p></div>
            <p className="mt-2 text-xs" style={{ color: UI.mute }}>{client.contactName || client.address || client.phone || "Client record"}</p>
          </Link>)}
        </div>
      </section>}

      {empty && <div className="mt-6 rounded-2xl p-8 text-center" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
        <Building2 className="mx-auto" size={30} style={{ color: UI.faint }} />
        <p className="mt-3 text-sm font-semibold" style={{ color: UI.text }}>Nothing found</p>
        <p className="mt-1 text-xs" style={{ color: UI.mute }}>Try part of the street address, job name or client name.</p>
      </div>}
    </div>
  </div>;
}
