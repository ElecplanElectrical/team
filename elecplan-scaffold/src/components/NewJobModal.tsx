"use client";

import { useState } from "react";
import { BriefcaseBusiness, CalendarDays, MapPin, X } from "lucide-react";

export type JobClientOption = { id: string; name: string; address: string | null };
export type JobCrewOption = { id: string; name: string; role: string };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72" };

export default function NewJobModal({ clients, crew, onClose, onDone, initialClientId, initialAddress }: { clients: JobClientOption[]; crew: JobCrewOption[]; onClose: () => void; onDone: () => void; initialClientId?: string; initialAddress?: string }) {
  const firstClientId = initialClientId && clients.some((client) => client.id === initialClientId) ? initialClientId : (clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(firstClientId);
  // A client's stored address may be their office/billing address, not the work site.
  // Only prefill an address when the job was launched from a specific site folder.
  const [address, setAddress] = useState(initialAddress ?? "");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onClientChange(id: string) {
    setClientId(id);
    // Never copy the client's office/billing address into a new job automatically.
    // Every new job gets its own site address unless launched from an existing site.
    setAddress("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !clientId || !address.trim()) return setError("Job title, client and job site address are required.");
    if (Boolean(scheduledStart) !== Boolean(scheduledEnd)) return setError("Enter both a scheduled start and end, or leave both blank.");
    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) return setError("Scheduled end must be after the start time.");

    setSaving(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        clientId,
        address: address.trim(),
        assignedToId: assignedToId || null,
        status,
        scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        notes: notes.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the job.");
      return;
    }
    onDone();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden md:h-auto md:max-h-[92vh] md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()}>
      <header className="flex shrink-0 items-start gap-3 border-b px-4 py-3 md:px-5 md:py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><BriefcaseBusiness size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>New job</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>{initialAddress ? `Create new work at ${initialAddress}.` : "Choose the client, then enter the actual address where this job is being done."}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: UI.mute, background: UI.panelAlt }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" className="md:col-span-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Switchboard upgrade" className="h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field} /></Field>
            <Field label="Client"><select value={clientId} onChange={(e) => onClientChange(e.target.value)} className="h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
            <Field label="Assigned to"><select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field}><option value="">Unassigned</option>{crew.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>
            <Field label="Job / site address" className="md:col-span-2"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter the address where the work is being done" className="h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field} /><span className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-4" style={{ color: UI.faint }}><MapPin size={12} className="mt-0.5 shrink-0" />This is separate from the client's office/billing address. This site address is what will be saved to the job and used in booking confirmation texts.</span></Field>
            <Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field}><option value="QUOTED">Quoted</option><option value="SCHEDULED">Scheduled</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETE">Complete</option><option value="INVOICED">Invoiced</option></select></Field>
            <div className="hidden md:block" />
            <Field label="Scheduled start"><input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className="h-12 w-full min-w-0 rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field} /></Field>
            <Field label="Scheduled end"><input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className="h-12 w-full min-w-0 rounded-lg px-3 text-base outline-none md:h-11 md:text-sm" style={field} /></Field>
            <div className="md:col-span-2 flex gap-2 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><CalendarDays size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>Adding both times automatically places the job on the team calendar.</p></div>
            <Field label="Notes" className="md:col-span-2"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Access details, scope, materials, customer notes…" className="w-full resize-none rounded-lg px-3 py-2.5 text-base outline-none md:text-sm" style={field} /></Field>
          </div>
          {error && <p className="mt-4 rounded-lg px-3 py-2 text-xs" style={{ color: UI.red, background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.24)" }}>{error}</p>}
          <div className="h-3" />
        </div>
        <div className="shrink-0 border-t px-4 pt-3 md:px-5" style={{ borderColor: UI.borderSoft, paddingBottom: "max(12px, env(safe-area-inset-bottom))", background: UI.panel }}>
          <div className="grid grid-cols-2 gap-2 md:flex md:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-semibold md:py-2.5" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60 md:py-2.5" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create job"}</button></div>
        </div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
