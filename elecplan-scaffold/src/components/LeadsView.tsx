"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";

const STAGES = ["NEW", "QUOTED", "WON", "LOST"] as const;
type LeadStage = (typeof STAGES)[number];

type LeadRow = {
  id: string;
  client: string;
  description: string;
  value: number;
  source: string | null;
  stage: LeadStage;
  createdAt: string;
};

const UI = {
  panel: "#07192b",
  panelAlt: "#09213a",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
  green: "#18d3a0",
  purple: "#8a5cf6",
  orange: "#ff9f1c",
  red: "#ff5e72",
};

const STAGE_STYLE: Record<LeadStage, { bg: string; fg: string; border: string }> = {
  NEW: { bg: "rgba(22,141,255,.12)", fg: "#62b6ff", border: "rgba(22,141,255,.30)" },
  QUOTED: { bg: "rgba(138,92,246,.12)", fg: "#b99cff", border: "rgba(138,92,246,.30)" },
  WON: { bg: "rgba(25,211,162,.11)", fg: "#4de2bb", border: "rgba(25,211,162,.28)" },
  LOST: { bg: "rgba(255,94,114,.10)", fg: "#ff8292", border: "rgba(255,94,114,.25)" },
};

function money(value: number) {
  return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function StagePill({ stage }: { stage: LeadStage }) {
  const style = STAGE_STYLE[stage];
  return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{stage.charAt(0) + stage.slice(1).toLowerCase()}</span>;
}

export default function LeadsView({ leads, clients }: { leads: LeadRow[]; clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | LeadStage>("ALL");

  const openValue = leads.filter((lead) => lead.stage === "NEW" || lead.stage === "QUOTED").reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = leads.filter((lead) => lead.stage === "WON").reduce((sum, lead) => sum + lead.value, 0);

  const filteredLeads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (stageFilter !== "ALL" && lead.stage !== stageFilter) return false;
      if (!needle) return true;
      return [lead.client, lead.description, lead.source ?? "", lead.stage].join(" ").toLowerCase().includes(needle);
    });
  }, [leads, query, stageFilter]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, description, value: Number(value), source }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create lead.");
      return;
    }
    setClientId("");
    setDescription("");
    setValue("");
    setSource("");
    setShowForm(false);
    router.refresh();
  }

  async function updateStage(id: string, stage: LeadStage) {
    setUpdatingId(id);
    setError(null);
    const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update lead.");
      return;
    }
    router.refresh();
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return (
    <>
      <TopBar title="Leads" subtitle="Manage and follow up on new leads" rightSlot={<button type="button" onClick={() => setShowForm((current) => !current)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}><Plus size={16} /> New lead</button>} />
      <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}>
        <div className="mx-auto w-full max-w-[1700px] space-y-3">
          {showForm && (
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-2" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
              <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
              <input required type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Estimated value" className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lead description" className="rounded-lg px-3 py-2.5 text-sm outline-none md:col-span-2" style={field} rows={3} />
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (referral, website, Google Ads…)" className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create lead"}</button></div>
            </form>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Open pipeline" value={money(openValue)} />
            <Metric label="Won value" value={money(wonValue)} />
            <Metric label="Total leads" value={String(leads.length)} />
          </div>

          {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

          <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: UI.borderSoft }}>
              <div className="relative min-w-0 flex-1 md:max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0"><span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: UI.faint }}><Filter size={13} /> Filters</span>{(["ALL", ...STAGES] as const).map((stage) => <button key={stage} type="button" onClick={() => setStageFilter(stage)} className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold" style={{ background: stageFilter === stage ? "rgba(22,141,255,.16)" : "#041323", color: stageFilter === stage ? UI.cyan : UI.mute, border: `1px solid ${stageFilter === stage ? "rgba(37,199,255,.30)" : UI.borderSoft}` }}>{stage === "ALL" ? "All leads" : stage.charAt(0) + stage.slice(1).toLowerCase()}</button>)}</div>
            </div>

            <div className="hidden grid-cols-[minmax(180px,1.1fr)_minmax(260px,1.5fr)_120px_130px_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Lead</span><span>Description</span><span>Value</span><span>Created</span><span>Status</span></div>

            {filteredLeads.map((lead) => (
              <div key={lead.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(180px,1.1fr)_minmax(260px,1.5fr)_120px_130px_150px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}>
                <div><p className="text-sm font-semibold" style={{ color: UI.text }}>{lead.client}</p><p className="mt-1 text-[11px]" style={{ color: UI.faint }}>{lead.source || "No source"}</p></div>
                <p className="text-xs leading-5" style={{ color: UI.mute }}>{lead.description}</p>
                <span className="text-sm font-semibold" style={{ color: UI.text }}>{money(lead.value)}</span>
                <span className="text-xs" style={{ color: UI.faint }}>{new Date(lead.createdAt).toLocaleDateString("en-AU")}</span>
                <div className="flex items-center gap-2"><StagePill stage={lead.stage} /><select aria-label={`Update ${lead.client} lead status`} disabled={updatingId === lead.id} value={lead.stage} onChange={(e) => void updateStage(lead.id, e.target.value as LeadStage)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STAGES.map((stage) => <option key={stage} value={stage}>{stage.charAt(0) + stage.slice(1).toLowerCase()}</option>)}</select></div>
              </div>
            ))}

            {filteredLeads.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No leads match the current filters.</div>}
            <div className="flex items-center justify-between px-4 py-3 text-[11px]" style={{ color: UI.faint }}><span>Showing {filteredLeads.length} of {leads.length} leads</span><span>{money(openValue)} open pipeline</span></div>
          </section>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px] font-medium" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</div></div>;
}
