"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Plus, Search, X } from "lucide-react";
import type { Role } from "@prisma/client";
import TopBar from "@/components/TopBar";

export type TimesheetRow = { id: string; userId: string; userName: string; date: string; hours: number; status: "PENDING" | "APPROVED" };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", green: "#18d3a0", orange: "#ff9f1c", red: "#ff5e72" };

export default function TimesheetsView({ entries, role }: { entries: TimesheetRow[]; role: Role; currentUserId: string }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const pending = entries.filter((entry) => entry.status === "PENDING");
  const approved = entries.filter((entry) => entry.status === "APPROVED");
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? entries.filter((entry) => entry.userName.toLowerCase().includes(needle)) : entries; }, [entries, query]);

  async function approve(id: string, status: "PENDING" | "APPROVED") {
    setBusy(id); setError(null);
    const res = await fetch(`/api/timesheets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update timesheet."); return; }
    router.refresh();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <>
    <TopBar title="Timesheets" subtitle="Track submitted and approved hours" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> Add hours</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-4"><Metric label="Entries" value={String(entries.length)} /><Metric label="Hours" value={totalHours.toFixed(1)} /><Metric label="Pending" value={String(pending.length)} accent={pending.length ? UI.orange : undefined} /><Metric label="Approved" value={String(approved.length)} /></div>
      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search timesheets…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="hidden grid-cols-[minmax(240px,1.4fr)_150px_120px_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Employee</span><span>Date</span><span>Hours</span><span>Status</span></div>{filtered.map((entry) => <div key={entry.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(240px,1.4fr)_150px_120px_150px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><Clock3 size={16} /></span><span className="text-sm font-semibold" style={{ color: UI.text }}>{entry.userName}</span></div><span className="text-xs" style={{ color: UI.mute }}>{new Date(entry.date).toLocaleDateString("en-AU")}</span><span className="text-sm font-semibold" style={{ color: UI.text }}>{entry.hours.toFixed(1)}h</span>{role === "EMPLOYEE" ? <span className="inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: entry.status === "APPROVED" ? "rgba(25,211,162,.10)" : "rgba(255,159,28,.10)", color: entry.status === "APPROVED" ? UI.green : UI.orange, border: `1px solid ${entry.status === "APPROVED" ? "rgba(25,211,162,.24)" : "rgba(255,159,28,.24)"}` }}>{entry.status === "APPROVED" ? "Approved" : "Pending"}</span> : <select aria-label={`Update ${entry.userName} timesheet status`} value={entry.status} disabled={busy === entry.id} onChange={(e) => void approve(entry.id, e.target.value as "PENDING" | "APPROVED")} className="rounded-lg px-2.5 py-2 text-xs outline-none disabled:opacity-60" style={field}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option></select>}</div>)}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No timesheets match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {entries.length} entries</div></section>
    </div></div>
    {showNew && <NewTimesheet onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewTimesheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(""); const [hours, setHours] = useState("8"); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(null); const res = await fetch("/api/timesheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date(`${date}T12:00:00`).toISOString(), hours: Number(hours) }) }); setSaving(false); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not add hours."); return; } onDone(); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}><div className="w-full max-w-md rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(e) => e.stopPropagation()}><div className="flex justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><h2 className="font-semibold" style={{ color: UI.text }}>Add timesheet</h2><button type="button" onClick={onClose} style={{ color: UI.mute }}><X size={18} /></button></div><form onSubmit={submit} className="flex flex-col gap-3 p-5"><label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: UI.mute }}>Date</span><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></label><label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: UI.mute }}>Hours</span><input required type="number" min="0.25" max="24" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></label>{error && <p className="text-xs" style={{ color: UI.red }}>{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Submit hours"}</button></div></form></div></div>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
