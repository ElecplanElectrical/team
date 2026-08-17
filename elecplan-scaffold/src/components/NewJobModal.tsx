"use client";

import { useState } from "react";
import { AlertTriangle, BriefcaseBusiness, CalendarDays, X } from "lucide-react";

export type JobClientOption = { id: string; name: string; address: string | null };
export type JobCrewOption = { id: string; name: string; role: string };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", red: "#ff5e72" };

export default function NewJobModal({ clients, crew, onClose, onDone }: { clients: JobClientOption[]; crew: JobCrewOption[]; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [address, setAddress] = useState(clients[0]?.address ?? "");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onClientChange(id: string) {
    setClientId(id);
    const selected = clients.find((client) => client.id === id);
    if (selected?.address) setAddress(selected.address);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !clientId || !address.trim()) return setError("Job title, client and address are required.");
    if (Boolean(scheduledStart) !== Boolean(scheduledEnd)) return setError("Enter both a scheduled start and end, or leave both blank.");
    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) return setError("Scheduled end must be after the start time.");

    setSaving(true);
    try {
      const res = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), clientId, address: address.trim(), assignedToId: assignedToId || null, status, scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null, scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null, notes: notes.trim() || null }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not create the job.");
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

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-2xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-job-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><BriefcaseBusiness size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="new-job-title" className="text-base font-semibold" style={{ color: UI.text }}>New job</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Create the job, assign crew and optionally place it straight on the calendar.</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5" aria-busy={saving}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Job title" className="md:col-span-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Switchboard upgrade" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoFocus /></Field>
          <Field label="Client"><select value={clientId} onChange={(e) => onClientChange(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
          <Field label="Assigned to"><select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">Unassigned</option>{crew.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>
          <Field label="Job address" className="md:col-span-2"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, state" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="QUOTED">Quoted</option><option value="SCHEDULED">Scheduled</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETE">Complete</option><option value="INVOICED">Invoiced</option></select></Field>
          <div className="hidden md:block" />
          <Field label="Scheduled start"><input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Scheduled end"><input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <div className="md:col-span-2 flex gap-2 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><CalendarDays size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>Adding both times automatically places the job on the team calendar.</p></div>
          <Field label="Notes" className="md:col-span-2"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Access details, scope, materials, customer notes…" className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field>
        </div>

        {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create job"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
