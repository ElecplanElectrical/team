"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Role } from "@prisma/client";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type TimesheetRow = {
  id: string;
  userId: string;
  userName: string;
  date: string;
  hours: number;
  status: "PENDING" | "APPROVED";
};

export default function TimesheetsView({ entries, role }: { entries: TimesheetRow[]; role: Role; currentUserId: string }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = entries.filter((entry) => entry.status === "PENDING");
  const approved = entries.filter((entry) => entry.status === "APPROVED");
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  async function approve(id: string, status: "PENDING" | "APPROVED") {
    setBusy(id); setError(null);
    const res = await fetch(`/api/timesheets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update timesheet."); return; }
    router.refresh();
  }

  return <>
    <TopBar
      title="Timesheets"
      subtitle={`${entries.length} entries · ${totalHours.toFixed(1)} hours · ${pending.length} pending`}
      rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> Add hours</button>}
    />
    <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
      {error && <div className="rounded-md px-4 py-3 text-sm" style={{ border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Metric label="Entries" value={String(entries.length)} />
        <Metric label="Hours" value={totalHours.toFixed(1)} />
        <Metric label="Pending" value={String(pending.length)} />
        <Metric label="Approved" value={String(approved.length)} />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        {entries.map((entry, index) => <div key={entry.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_140px_110px_150px] gap-2 md:gap-3 items-center px-4 md:px-5 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none" }}>
          <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{entry.userName}</span>
          <span className="text-xs" style={{ fontFamily: FONTS.mono, color: COLORS.textMute }}>{new Date(entry.date).toLocaleDateString("en-AU")}</span>
          <span className="text-sm font-semibold" style={{ fontFamily: FONTS.mono, color: COLORS.text }}>{entry.hours.toFixed(1)}h</span>
          {role === "EMPLOYEE" ? <span className="text-xs font-semibold" style={{ color: entry.status === "APPROVED" ? COLORS.accent : COLORS.textMute }}>{entry.status === "APPROVED" ? "Approved" : "Pending"}</span> : <select value={entry.status} disabled={busy === entry.id} onChange={(e) => approve(entry.id, e.target.value as "PENDING" | "APPROVED")} className="rounded-md px-2.5 py-1.5 text-xs outline-none disabled:opacity-60" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option></select>}
        </div>)}
        {entries.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No timesheets yet — add the first entry.</div>}
      </div>
    </div>
    {showNew && <NewTimesheet onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewTimesheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("8");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const style = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch("/api/timesheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date(`${date}T12:00:00`).toISOString(), hours: Number(hours) }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not add hours."); return; }
    onDone();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
    <div className="w-full max-w-md rounded-lg" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}><h2 className="font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>Add timesheet</h2><button type="button" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button></div>
      <form onSubmit={submit} className="p-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: COLORS.textMute }}>Date</span><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: COLORS.textMute }}>Hours</span><input required type="number" min="0.25" max="24" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></label>
        {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Submit hours"}</button></div>
      </form>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>; }
