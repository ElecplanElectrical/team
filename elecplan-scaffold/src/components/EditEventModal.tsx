"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertTriangle, CalendarClock, CheckCircle2, MessageSquareText, Trash2, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { EVENT_TYPES } from "@/lib/theme";

export type CalendarEvent = {
  id: string;
  title: string;
  customTitle: string | null;
  type: string;
  jobId: string | null;
  assignedToId: string | null;
  startsAt: string;
  endsAt: string;
  fallback?: boolean;
};

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72" };

export default function EditEventModal({
  event,
  jobs,
  employees,
  role,
  currentUserId,
  onClose,
  onDone,
}: {
  event: CalendarEvent;
  jobs: { id: string; title: string }[];
  employees: { id: string; name: string }[];
  role: Role;
  currentUserId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const startDate = parseISO(event.startsAt);
  const endDate = parseISO(event.endsAt);
  const crewOnly = role === "EMPLOYEE";
  const crewJobReadOnly = crewOnly && (event.type === "job" || Boolean(event.jobId));
  const fallbackJob = Boolean(event.fallback && event.jobId);
  const [title, setTitle] = useState(event.customTitle ?? "");
  const [type, setType] = useState(event.type);
  const [jobId, setJobId] = useState(event.jobId ?? "");
  const [date, setDate] = useState(format(startDate, "yyyy-MM-dd"));
  const [start, setStart] = useState(format(startDate, "HH:mm"));
  const [end, setEnd] = useState(format(endDate, "HH:mm"));
  const [assignedToId, setAssignedToId] = useState(crewOnly ? currentUserId : event.assignedToId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingText, setSendingText] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (crewJobReadOnly) return;
    setError(null);
    setNotice(null);
    const startsAt = new Date(`${date}T${start}:00`);
    const endsAt = new Date(`${date}T${end}:00`);
    if (!(endsAt > startsAt)) return setError("End time must be after start time.");

    setSaving(true);
    try {
      if (fallbackJob && event.jobId) {
        const res = await fetch(`/api/jobs/${event.jobId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledStart: startsAt.toISOString(), scheduledEnd: endsAt.toISOString(), assignedToId: assignedToId || null }) });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "Could not update the job schedule.");
          return;
        }
        onDone();
        return;
      }

      const payload = crewOnly
        ? { title: title.trim() || null, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }
        : { title: title.trim() || null, type, jobId: jobId || null, assignedToId: assignedToId || null, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };

      const res = await fetch(`/api/events/${event.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not update the event.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function sendConfirmation() {
    if (!event.jobId || sendingText) return;
    setError(null);
    setNotice(null);
    setSendingText(true);
    try {
      const res = await fetch(`/api/jobs/${event.jobId}/confirmation`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not send the client confirmation.");
        return;
      }
      setNotice("Client confirmation text sent.");
    } catch {
      setError("Could not reach Elecplan to send the SMS. Check your connection and try again.");
    } finally {
      setSendingText(false);
    }
  }

  async function remove() {
    if (crewJobReadOnly) return;
    const warning = event.type === "job" && event.jobId ? "Remove this job from the calendar? The linked job schedule will be cleared." : "Delete this event?";
    if (!window.confirm(warning)) return;

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      if (fallbackJob && event.jobId) {
        const res = await fetch(`/api/jobs/${event.jobId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledStart: null, scheduledEnd: null }) });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "Could not clear the job schedule.");
          return;
        }
        onDone();
        return;
      }

      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not delete the event.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const canTextClient = !crewOnly && event.type === "job" && Boolean(event.jobId);

  if (crewJobReadOnly) {
    return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
      <section className="w-full max-w-md overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="job-schedule-title">
        <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><CalendarClock size={18} /></span>
          <div className="min-w-0 flex-1"><h2 id="job-schedule-title" className="text-base font-semibold" style={{ color: UI.text }}>Job schedule</h2><p className="mt-1 truncate text-xs" style={{ color: UI.faint }}>{event.title}</p></div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
        </header>
        <div className="p-5"><div className="rounded-xl p-3 text-sm" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.text }}>{format(startDate, "EEEE d MMM yyyy, h:mma")} – {format(endDate, "h:mma")}</div><p className="mt-4 text-sm leading-6" style={{ color: UI.mute }}>Job-linked calendar events are read-only for crew. An admin or supervisor can change the job time or assignment.</p><div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}>Close</button></div></div>
      </section>
    </div>;
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-event-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><CalendarClock size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="edit-event-title" className="text-base font-semibold" style={{ color: UI.text }}>Edit calendar event</h2><p className="mt-1 truncate text-xs" style={{ color: UI.faint }}>{event.title}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2"><input disabled={fallbackJob} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={crewOnly ? "e.g. Supplier call" : "Falls back to job title"} className="h-11 w-full rounded-lg px-3 text-sm outline-none disabled:opacity-60" style={field} /></Field>
          {!crewOnly && <><Field label="Type"><select disabled={fallbackJob} value={type} onChange={(e) => setType(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm capitalize outline-none disabled:opacity-60" style={field}>{EVENT_TYPES.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}</select></Field><Field label="Linked job"><select disabled={fallbackJob} value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none disabled:opacity-60" style={field}><option value="">No linked job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field></>}
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          {!crewOnly ? <Field label="Assign to"><select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Field> : <div className="hidden md:block" />}
          <Field label="Start"><input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="End"><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
        </div>

        {fallbackJob && <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.faint }}>This booking was recovered directly from the job schedule. Saving it will rebuild the missing calendar link automatically.</div>}
        {crewOnly && <p className="mt-4 text-xs" style={{ color: UI.faint }}>Crew can change the title and time of personal non-job events only.</p>}
        {event.type === "job" && event.jobId && <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.faint }}>Changes to this linked job event also update the job schedule and crew assignment. Save schedule changes before sending a confirmation text.</div>}
        {notice && <div className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(25,211,160,.08)", border: "1px solid rgba(25,211,160,.22)", color: UI.green }}><CheckCircle2 size={14} className="mt-0.5 shrink-0" /><span>{notice}</span></div>}
        {error && <div className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

        {canTextClient && <button type="button" onClick={sendConfirmation} disabled={sendingText || saving || deleting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: "rgba(22,141,255,.09)", border: "1px solid rgba(37,199,255,.28)", color: UI.cyan }}><MessageSquareText size={15} /> {sendingText ? "Sending…" : "Send client confirmation text"}</button>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={remove} disabled={deleting || saving || sendingText} className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ color: UI.red, border: "1px solid rgba(255,94,114,.28)", background: "rgba(255,94,114,.06)" }}><Trash2 size={14} /> {deleting ? "Removing…" : "Remove"}</button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || deleting || sendingText} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Save changes"}</button></div>
        </div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
