"use client";

import { useState } from "react";
import { CalendarDays, Pencil, X } from "lucide-react";
import type { TimelineJob } from "@/components/JobTimeline";
import type { JobCrewOption } from "@/components/NewJobModal";

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72" };

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function EditJobModal({ job, crew, onClose, onDone }: { job: TimelineJob; crew: JobCrewOption[]; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState(job.title);
  const [address, setAddress] = useState(job.address);
  const [assignedToId, setAssignedToId] = useState(job.assignedToId ?? "");
  const [scheduledStart, setScheduledStart] = useState(toLocalInput(job.scheduledStart));
  const [scheduledEnd, setScheduledEnd] = useState(toLocalInput(job.scheduledEnd));
  const [notes, setNotes] = useState(job.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !address.trim()) return setError("Job title and address are required.");
    if (Boolean(scheduledStart) !== Boolean(scheduledEnd)) return setError("Add both scheduled start and end, or clear both.");

    setSaving(true);
    const res = await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), address: address.trim(), assignedToId: assignedToId || null, scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null, scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null, notes: notes.trim() || null }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update the job."); return; }
    onDone();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="w-full max-w-2xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><Pencil size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>Edit job</h2><p className="mt-1 truncate text-xs" style={{ color: UI.faint }}>{job.ref} · {job.client}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Job title" className="md:col-span-2"><input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoFocus /></Field>
          <Field label="Job address" className="md:col-span-2"><input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Assigned to"><select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">Unassigned</option>{crew.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>
          <div className="hidden md:block" />
          <Field label="Scheduled start"><input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Scheduled end"><input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <div className="md:col-span-2 flex gap-2 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><CalendarDays size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>Changing these times updates the linked Calendar event. Clearing both removes that scheduled event.</p></div>
          <Field label="Notes" className="md:col-span-2"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field>
        </div>

        {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Save changes"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
