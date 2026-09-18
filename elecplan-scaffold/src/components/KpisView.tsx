"use client";

import { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import TopBar from "@/components/TopBar";

type Employee = { id: string; name: string; role: string };
type Kpi = {
  id: string;
  userId: string;
  weekStart: string;
  jobsComplete: number;
  hoursWorked: number;
  reworkCount: number;
  notes: string | null;
};

const UI = { panel: "#0a2038", alt: "#103152", border: "rgba(125,211,252,.28)", text: "#f5f9ff", mute: "#a8c3dd", cyan: "#7dd3fc", blue: "#38bdf8" };

function mondayIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function KpisView({ employees, initialKpis }: { employees: Employee[]; initialKpis: Kpi[] }) {
  const [kpis, setKpis] = useState(initialKpis);
  const [employee, setEmployee] = useState(employees[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(mondayIso());
  const [jobsComplete, setJobsComplete] = useState("0");
  const [hoursWorked, setHoursWorked] = useState("0");
  const [reworkCount, setReworkCount] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(() => [...kpis].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [kpis]);
  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text };

  async function save() {
    setError("");
    if (!employee || !weekStart) return setError("Choose an employee and week.");
    const payload = {
      userId: employee,
      weekStart,
      jobsComplete: Number(jobsComplete),
      hoursWorked: Number(hoursWorked),
      reworkCount: Number(reworkCount),
      notes: notes.trim() || null,
    };
    if ([payload.jobsComplete, payload.hoursWorked, payload.reworkCount].some((n) => !Number.isFinite(n) || n < 0)) return setError("Enter valid KPI figures.");

    setSaving(true);
    const response = await fetch("/api/kpis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) return setError(body?.error ?? "Could not save KPI");
    setKpis((current) => [body, ...current.filter((k) => !(k.userId === body.userId && k.weekStart === body.weekStart))]);
    setNotes("");
  }

  return <>
    <TopBar title="KPIs" subtitle="Weekly team performance" />
    <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "radial-gradient(circle at 55% 0%,rgba(56,189,248,.14),transparent 38%),#061525" }}>
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-xl p-4 md:p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="mb-4 flex items-center gap-2"><Target size={18} style={{ color: UI.cyan }} /><h2 className="font-semibold" style={{ color: UI.text }}>Weekly KPI entry</h2></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs" style={{ color: UI.mute }}>Employee<select value={employee} onChange={(e) => setEmployee(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field}>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
            <label className="text-xs" style={{ color: UI.mute }}>Week starting<input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field} /></label>
            <label className="text-xs" style={{ color: UI.mute }}>Jobs complete<input type="number" min="0" value={jobsComplete} onChange={(e) => setJobsComplete(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field} /></label>
            <label className="text-xs" style={{ color: UI.mute }}>Hours worked<input type="number" min="0" step="0.25" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field} /></label>
            <label className="text-xs" style={{ color: UI.mute }}>Rework / callbacks<input type="number" min="0" value={reworkCount} onChange={(e) => setReworkCount(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field} /></label>
            <label className="text-xs" style={{ color: UI.mute }}>Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-11 w-full rounded-lg px-3 text-sm" style={field} placeholder="Optional" /></label>
          </div>
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end"><button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.blue, color: "#06213a" }}><Plus size={15} />{saving ? "Saving…" : "Save week"}</button></div>
        </section>

        <section className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <h2 className="mb-3 text-sm font-semibold" style={{ color: UI.text }}>Weekly results</h2>
          {sorted.length === 0 ? <p className="py-8 text-center text-sm" style={{ color: UI.mute }}>No KPI results yet.</p> : <div className="space-y-2">{sorted.map((k) => {
            const employeeRow = employees.find((e) => e.id === k.userId);
            return <div key={k.id} className="rounded-xl p-3" style={{ background: UI.alt, border: `1px solid ${UI.border}` }}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold" style={{ color: UI.cyan }}>{employeeRow?.name ?? "Employee"}</p><p className="mt-1 text-sm font-semibold" style={{ color: UI.text }}>Week of {new Date(`${k.weekStart}T00:00:00`).toLocaleDateString("en-AU")}</p></div><div className="flex gap-4 text-xs" style={{ color: UI.mute }}><span>{k.jobsComplete} jobs</span><span>{k.hoursWorked} h</span><span>{k.reworkCount} rework</span></div></div>{k.notes && <p className="mt-2 text-sm" style={{ color: UI.mute }}>{k.notes}</p>}</div>;
          })}</div>}
        </section>
      </div>
    </main>
  </>;
}
