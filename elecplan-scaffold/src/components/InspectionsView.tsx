"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

const STATUSES = ["SCHEDULED", "PASSED", "FAILED"] as const;
type Status = (typeof STATUSES)[number];

export type InspectionRow = {
  id: string;
  type: string;
  status: Status;
  date: string;
  jobTitle: string;
  jobAddress: string;
};

type Job = { id: string; title: string; address: string };

const label = (s: Status) => s[0] + s.slice(1).toLowerCase();

export default function InspectionsView({ inspections, jobs }: { inspections: InspectionRow[]; jobs: Job[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = {
    scheduled: inspections.filter((x) => x.status === "SCHEDULED").length,
    passed: inspections.filter((x) => x.status === "PASSED").length,
    failed: inspections.filter((x) => x.status === "FAILED").length,
  };

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/inspections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update inspection.");
      return;
    }
    router.refresh();
  }

  return <>
    <TopBar
      title="Inspections"
      subtitle={`${counts.scheduled} scheduled · ${counts.passed} passed · ${counts.failed} failed`}
      rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> New inspection</button>}
    />
    <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
      {error && <div className="rounded-md px-4 py-3 text-sm" style={{ border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Total" value={inspections.length} />
        <Metric label="Scheduled" value={counts.scheduled} />
        <Metric label="Passed" value={counts.passed} />
        <Metric label="Failed" value={counts.failed} />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        {inspections.map((item, index) => <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_140px_150px] gap-2 md:gap-3 items-center px-4 md:px-5 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none" }}>
          <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{item.jobTitle}</div><div className="text-xs truncate" style={{ color: COLORS.textFaint }}>{item.jobAddress}</div></div>
          <span className="text-sm" style={{ color: COLORS.textMute }}>{item.type}</span>
          <span className="text-xs" style={{ fontFamily: FONTS.mono, color: COLORS.textMute }}>{new Date(item.date).toLocaleDateString("en-AU")}</span>
          <select value={item.status} disabled={busy === item.id} onChange={(e) => setStatus(item.id, e.target.value as Status)} className="rounded-md px-2.5 py-1.5 text-xs outline-none disabled:opacity-60" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: item.status === "FAILED" ? COLORS.coral : COLORS.text }}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        </div>)}
        {inspections.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No inspections yet — schedule the first one.</div>}
      </div>
    </div>
    {showNew && <NewInspection jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewInspection({ jobs, onClose, onDone }: { jobs: Job[]; onClose: () => void; onDone: () => void }) {
  const [jobId, setJobId] = useState("");
  const [type, setType] = useState("Electrical inspection");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<Status>("SCHEDULED");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldStyle = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId || !date) return setError("Choose a job and inspection date.");
    setSaving(true); setError(null);
    const res = await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, type, date: new Date(`${date}T12:00:00`).toISOString(), status }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); return setError(body?.error ?? "Could not create inspection."); }
    onDone();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
    <div className="w-full max-w-lg rounded-lg" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}><h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New inspection</h2><button type="button" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button></div>
      <form onSubmit={submit} className="p-5 flex flex-col gap-3">
        <Field label="Job"><select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={fieldStyle}><option value="">Choose job</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.address}</option>)}</select></Field>
        <Field label="Inspection type"><input required value={type} onChange={(e) => setType(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={fieldStyle} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Date"><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={fieldStyle} /></Field><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-md px-3 py-2 text-sm" style={fieldStyle}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field></div>
        {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create inspection"}</button></div>
      </form>
    </div>
  </div>;
}

function Field({ label: title, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{title}</span>{children}</label>; }
function Metric({ label: title, value }: { label: string; value: number }) { return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{title}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>; }
