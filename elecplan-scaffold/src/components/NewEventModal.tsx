"use client";

import { useState } from "react";
import { AlertTriangle, CalendarPlus2, CheckCircle2, MessageSquareText, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { EVENT_TYPES } from "@/lib/theme";

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72" };

export default function NewEventModal({
  jobs,
  employees,
  role,
  currentUserId,
  defaultDate,
  onClose,
  onDone,
}: {
  jobs: { id: string; title: string }[];
  employees: { id: string; name: string }[];
  role: Role;
  currentUserId: string;
  defaultDate: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const crewOnly = role === "EMPLOYEE";
  const allowedTypes = crewOnly ? EVENT_TYPES.filter((type) => type !== "job") : EVENT_TYPES;
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(crewOnly ? "call" : "job");
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [assignedToId, setAssignedToId] = useState(crewOnly ? currentUserId : "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(sendConfirmation: boolean) {
    if (saving) return;
    setError(null);
    setNotice(null);
    const startsAt = new Date(`${date}T${start}:00`);
    const endsAt = new Date(`${date}T${end}:00`);
    if (!(endsAt > startsAt)) return setError("End time must be after start time.");
    if (sendConfirmation && (!jobId || type !== "job")) return setError("Select a linked job before sending a client confirmation.");

    setSaving(true);
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title || null, type, jobId: crewOnly ? null : jobId || null, assignedToId: crewOnly ? currentUserId : assignedToId || null, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not create the event. Check the details and try again.");
        return;
      }

      if (sendConfirmation && jobId) {
        const textRes = await fetch(`/api/jobs/${jobId}/confirmation`, { method: "POST" });
        if (!textRes.ok) {
          const body = await textRes.json().catch(() => null);
          setNotice(`Event created, but the client text was not sent. ${body?.error ?? "Check SMS settings and the client phone number."}`);
          onDone();
          return;
        }
        setNotice("Event created and the client confirmation text was sent.");
        onDone();
        return;
      }

      onDone();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const canTextClient = !crewOnly && type === "job" && Boolean(jobId);

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-event-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><CalendarPlus2 size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="new-event-title" className="text-base font-semibold" style={{ color: UI.text }}>New calendar event</h2><p className="mt-1 text-xs leading-5" style={{ color: UI.faint }}>{crewOnly ? "Add a personal calendar item. Job scheduling stays with admins and supervisors." : "Create a job-linked or general team event."}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={(e) => { e.preventDefault(); void save(false); }} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional custom title" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm capitalize outline-none" style={field}>{allowedTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}</select></Field>
          {!crewOnly ? <Field label="Linked job"><select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">No linked job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field> : <div className="hidden md:block" />}
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          {!crewOnly ? <Field label="Assign to"><select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field> : <div className="hidden md:block" />}
          <Field label="Start"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="End"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
        </div>

        {canTextClient && <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.faint }}>Client SMS remains manual. “Create & text client” creates the event first, then sends one confirmation to the linked job’s client mobile.</div>}
        {notice && <div className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(25,211,160,.08)", border: "1px solid rgba(25,211,160,.22)", color: UI.green }}><CheckCircle2 size={14} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}
        {error && <div className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button>
          {canTextClient && <button type="button" disabled={saving} onClick={() => void save(true)} className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ color: UI.cyan, border: "1px solid rgba(37,199,255,.28)", background: "rgba(22,141,255,.09)" }}><MessageSquareText size={14} /> Create & text client</button>}
          <button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create event"}</button>
        </div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
