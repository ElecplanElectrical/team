"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Plus, Search, X } from "lucide-react";
import type { Role } from "@prisma/client";
import TopBar from "@/components/TopBar";

export type TimesheetRow = { id: string; userId: string; userName: string; weekStart: string; hours: number; status: "PENDING" | "APPROVED" };
export type TrackedTimeRow = { userId: string; userName: string; weekStart: string; hours: number };

import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default function TimesheetsView({ entries, tracked, role, currentUserId }: { entries: TimesheetRow[]; tracked: TrackedTimeRow[]; role: Role; currentUserId: string }) {
  const router = useRouter();
  const [newDraft, setNewDraft] = useState<{ weekStart: string; hours: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const pending = entries.filter((entry) => entry.status === "PENDING");
  const approved = entries.filter((entry) => entry.status === "APPROVED");
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const trackedHours = tracked.reduce((sum, entry) => sum + entry.hours, 0);
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? entries.filter((entry) => entry.userName.toLowerCase().includes(needle)) : entries; }, [entries, query]);

  async function approve(id: string, status: "PENDING" | "APPROVED") {
    setBusy(id); setError(null);
    const res = await fetch(`/api/timesheets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update timesheet."); return; }
    router.refresh();
  }

  const field = { ...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <>
    <TopBar title="Timesheets" subtitle="Automatic field timer hours plus submitted timesheets" rightSlot={<button type="button" onClick={() => setNewDraft({ weekStart: "", hours: "38" })} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ ...UI.primary, color: "#06213a" }}><Plus size={16} /> Add hours</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "var(--ep-main)" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-4"><Metric label="Submitted hours" value={totalHours.toFixed(1)} /><Metric label="Field timer hours" value={trackedHours.toFixed(1)} /><Metric label="Pending" value={String(pending.length)} accent={pending.length ? UI.orange : undefined} /><Metric label="Approved" value={String(approved.length)} /></div>
      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

      <section className="overflow-hidden rounded-xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
        <div className="border-b px-4 py-3" style={{ borderColor: UI.borderSoft }}><p className="text-sm font-semibold" style={{ color: UI.text }}>Tracked from job timers</p><p className="mt-1 text-[11px]" style={{ color: UI.faint }}>Built automatically from I’ve arrived → Finish job / Revisit on field jobs. No double entry.</p></div>
        {tracked.length ? tracked.map((row) => {
          const submitted = entries.filter((entry) => entry.userId === row.userId && entry.weekStart.slice(0, 10) === row.weekStart).reduce((sum, entry) => sum + entry.hours, 0);
          const remaining = Math.max(0, row.hours - submitted);
          return <div key={`${row.userId}:${row.weekStart}`} className="grid gap-3 border-b px-4 py-4 md:grid-cols-[minmax(220px,1fr)_150px_120px_minmax(170px,auto)] md:items-center" style={{ borderColor: UI.borderSoft }}>
            <div><p className="text-sm font-semibold" style={{ color: UI.text }}>{row.userName}</p><p className="mt-1 text-[11px]" style={{ color: UI.faint }}>Week starting {new Date(`${row.weekStart}T12:00:00`).toLocaleDateString("en-AU")}</p></div>
            <div><p className="text-[10px]" style={{ color: UI.faint }}>Field timer</p><p className="mt-1 font-semibold" style={{ color: UI.cyan }}>{row.hours.toFixed(2)}h</p></div>
            <div><p className="text-[10px]" style={{ color: UI.faint }}>Submitted</p><p className="mt-1 font-semibold" style={{ color: UI.text }}>{submitted.toFixed(2)}h</p></div>
            <div className="flex items-center justify-between gap-3 md:justify-end">{remaining > 0 ? <span className="text-xs font-semibold" style={{ color: UI.orange }}>{remaining.toFixed(2)}h not submitted</span> : <span className="text-xs font-semibold" style={{ color: UI.green }}>Covered</span>}{row.userId === currentUserId && remaining > 0 && <button type="button" onClick={() => setNewDraft({ weekStart: row.weekStart, hours: remaining.toFixed(2) })} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "rgba(67,210,255,.10)", border: `1px solid ${UI.border}`, color: UI.cyan }}>Use tracked hours</button>}</div>
          </div>;
        }) : <div className="px-5 py-8 text-center text-sm" style={{ color: UI.faint }}>No completed field timer sessions yet.</div>}
      </section>

      <section className="overflow-hidden rounded-xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search timesheets…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="hidden grid-cols-[minmax(240px,1.4fr)_150px_120px_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Employee</span><span>Week starting</span><span>Hours</span><span>Status</span></div>{filtered.map((entry) => <div key={entry.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(240px,1.4fr)_150px_120px_150px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan }}><Clock3 size={16} /></span><span className="text-sm font-semibold" style={{ color: UI.text }}>{entry.userName}</span></div><span className="text-xs" style={{ color: UI.mute }}>{new Date(entry.weekStart).toLocaleDateString("en-AU")}</span><span className="text-sm font-semibold" style={{ color: UI.text }}>{entry.hours.toFixed(1)}h</span>{role === "EMPLOYEE" ? <span className="inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: entry.status === "APPROVED" ? "rgba(25,211,162,.10)" : "rgba(255,159,28,.10)", color: entry.status === "APPROVED" ? UI.green : UI.orange, border: `1px solid ${entry.status === "APPROVED" ? "rgba(25,211,162,.24)" : "rgba(255,159,28,.24)"}` }}>{entry.status === "APPROVED" ? "Approved" : "Pending"}</span> : <select aria-label={`Update ${entry.userName} timesheet status`} value={entry.status} disabled={busy === entry.id} onChange={(e) => void approve(entry.id, e.target.value as "PENDING" | "APPROVED")} className="rounded-lg px-2.5 py-2 text-xs outline-none disabled:opacity-60" style={field}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option></select>}</div>)}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No timesheets match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {entries.length} entries</div></section>
    </div></div>
    {newDraft && <NewTimesheet defaultWeekStart={newDraft.weekStart} defaultHours={newDraft.hours} onClose={() => setNewDraft(null)} onDone={() => { setNewDraft(null); router.refresh(); }} />}
  </>;
}

function NewTimesheet({ defaultWeekStart, defaultHours, onClose, onDone }: { defaultWeekStart: string; defaultHours: string; onClose: () => void; onDone: () => void }) {
  const [weekStart, setWeekStart] = useState(defaultWeekStart); const [hours, setHours] = useState(defaultHours); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const field = { ...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(null); const res = await fetch("/api/timesheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekStart: new Date(`${weekStart}T12:00:00`).toISOString(), hours: Number(hours) }) }); setSaving(false); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not add hours."); return; } onDone(); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}><div className="w-full max-w-md rounded-t-2xl md:rounded-2xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(e) => e.stopPropagation()}><div className="flex justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><h2 className="font-semibold" style={{ color: UI.text }}>Add timesheet</h2><button type="button" onClick={onClose} style={{ color: UI.mute }}><X size={18} /></button></div><form onSubmit={submit} className="flex flex-col gap-3 p-5"><label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: UI.mute }}>Week starting</span><input required type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></label><label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: UI.mute }}>Hours for the week</span><input required type="number" min="0.25" max="168" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></label>{error && <p className="text-xs" style={{ color: UI.red }}>{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm" style={{ ...UI.inset, background: UI.panelAlt, color: UI.mute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ ...UI.primary, color: "#06213a" }}>{saving ? "Saving…" : "Submit hours"}</button></div></form></div></div>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
