"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, ON_ACCENT } from "@/lib/theme";

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

function money(value: number) {
  return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
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

  const openValue = leads.filter((lead) => lead.stage === "NEW" || lead.stage === "QUOTED").reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = leads.filter((lead) => lead.stage === "WON").reduce((sum, lead) => sum + lead.value, 0);

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
    const res = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update lead.");
      return;
    }
    router.refresh();
  }

  const field = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text } as const;

  return (
    <>
      <TopBar title="Leads" subtitle={`${money(openValue)} open pipeline · ${money(wonValue)} won`} rightSlot={<button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> New lead</button>} />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {showForm && (
          <form onSubmit={submit} className="rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="rounded-md px-3 py-2 text-sm outline-none" style={field}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
            <input required type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Estimated value" className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lead description" className="rounded-md px-3 py-2 text-sm outline-none md:col-span-2" style={field} rows={3} />
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (e.g. referral, website)" className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create lead"}</button></div>
            {error && <p className="md:col-span-2 text-xs" style={{ color: COLORS.coral }}>{error}</p>}
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Open pipeline" value={money(openValue)} />
          <Metric label="Won" value={money(wonValue)} />
          <Metric label="Leads" value={String(leads.length)} />
        </div>

        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          {leads.map((lead, index) => (
            <div key={lead.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.7fr_120px_130px_140px] gap-2 md:gap-4 items-center px-4 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none" }}>
              <div><p className="text-sm font-semibold" style={{ color: COLORS.text }}>{lead.client}</p><p className="text-xs mt-1" style={{ color: COLORS.textFaint }}>{lead.source || "No source"}</p></div>
              <p className="text-xs" style={{ color: COLORS.textMute }}>{lead.description}</p>
              <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{money(lead.value)}</span>
              <span className="text-xs" style={{ color: COLORS.textFaint }}>{new Date(lead.createdAt).toLocaleDateString("en-AU")}</span>
              <select disabled={updatingId === lead.id} value={lead.stage} onChange={(e) => updateStage(lead.id, e.target.value as LeadStage)} className="rounded-md px-2.5 py-1.5 text-xs outline-none disabled:opacity-60" style={field}>{STAGES.map((stage) => <option key={stage} value={stage}>{stage.charAt(0) + stage.slice(1).toLowerCase()}</option>)}</select>
            </div>
          ))}
          {leads.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No leads yet.</div>}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>;
}
