"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, Search, X } from "lucide-react";
import TopBar from "@/components/TopBar";

const STATUSES = ["SCHEDULED", "PASSED", "FAILED"] as const;
type Status = (typeof STATUSES)[number];
export type InspectionRow = { id: string; type: string; status: Status; date: string; jobTitle: string; jobAddress: string };
type Job = { id: string; title: string; address: string };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72", orange: "#ff9f1c" };
const label = (s: Status) => s[0] + s.slice(1).toLowerCase();

function statusStyle(status: Status) {
  if (status === "PASSED") return { bg: "rgba(25,211,162,.10)", fg: UI.green, border: "rgba(25,211,162,.24)" };
  if (status === "FAILED") return { bg: "rgba(255,94,114,.10)", fg: UI.red, border: "rgba(255,94,114,.24)" };
  return { bg: "rgba(22,141,255,.11)", fg: UI.cyan, border: "rgba(37,199,255,.24)" };
}

export default function InspectionsView({ inspections, jobs }: { inspections: InspectionRow[]; jobs: Job[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const counts = { scheduled: inspections.filter((x) => x.status === "SCHEDULED").length, passed: inspections.filter((x) => x.status === "PASSED").length, failed: inspections.filter((x) => x.status === "FAILED").length };
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? inspections.filter((item) => [item.type, item.jobTitle, item.jobAddress, item.status].join(" ").toLowerCase().includes(needle)) : inspections; }, [inspections, query]);

  async function setStatus(id: string, status: Status) {
    setBusy(id); setError(null);
    const res = await fetch(`/api/inspections/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update inspection."); return; }
    router.refresh();
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  return <>
    <TopBar title="Inspections" subtitle="Schedule and track compliance inspections" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New inspection</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-4"><Metric label="Total" value={String(inspections.length)} /><Metric label="Scheduled" value={String(counts.scheduled)} /><Metric label="Passed" value={String(counts.passed)} /><Metric label="Failed" value={String(counts.failed)} accent={counts.failed ? UI.red : undefined} /></div>
      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inspections…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_140px_160px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Job</span><span>Inspection</span><span>Date</span><span>Status</span></div>{filtered.map((item) => { const style = statusStyle(item.status); return <div key={item.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_140px_160px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><ClipboardCheck size={16} /></span><div className="min-w-0"><div className="truncate text-sm font-semibold" style={{ color: UI.text }}>{item.jobTitle}</div><div className="mt-1 truncate text-[11px]" style={{ color: UI.faint }}>{item.jobAddress}</div></div></div><span className="text-xs" style={{ color: UI.mute }}>{item.type}</span><span className="text-xs" style={{ color: UI.mute }}>{new Date(item.date).toLocaleDateString("en-AU")}</span><div className="flex items-center gap-2"><span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{label(item.status)}</span><select aria-label={`Update ${item.jobTitle} inspection status`} value={item.status} disabled={busy === item.id} onChange={(e) => void setStatus(item.id, e.target.value as Status)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div></div>; })}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No inspections match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {inspections.length} inspections</div></section>
    </div></div>
    {showNew && <NewInspection jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewInspection({ jobs, onClose, onDone }: { jobs: Job[]; onClose: () => void; onDone: () => void }) {
  const [jobId, setJobId] = useState(""); const [type, setType] = useState("Electrical inspection"); const [date, setDate] = useState(""); const [status, setStatus] = useState<Status>("SCHEDULED"); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!jobId || !date) return setError("Choose a job and inspection date."); setSaving(true); setError(null); const res = await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, type, date: new Date(`${date}T12:00:00`).toISOString(), status }) }); setSaving(false); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not create inspection."); return; } onDone(); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}><div className="w-full max-w-lg rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><h2 className="text-base font-semibold" style={{ color: UI.text }}>New inspection</h2><button type="button" onClick={onClose} style={{ color: UI.mute }}><X size={18} /></button></div><form onSubmit={submit} className="flex flex-col gap-3 p-5"><Field label="Job"><select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field}><option value="">Choose job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.address}</option>)}</select></Field><Field label="Inspection type"><input required value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Date"><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-lg px-3 py-2.5 text-sm" style={field}>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field></div>{error && <p className="text-xs" style={{ color: UI.red }}>{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create inspection"}</button></div></form></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
