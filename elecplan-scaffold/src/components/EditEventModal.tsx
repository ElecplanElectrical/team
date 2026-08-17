"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { COLORS, FONTS, ON_ACCENT, EVENT_TYPES } from "@/lib/theme";

export type CalendarEvent = {
  id: string;
  title: string;
  customTitle: string | null;
  type: string;
  jobId: string | null;
  assignedToId: string | null;
  startsAt: string;
  endsAt: string;
};

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
  const [title, setTitle] = useState(event.customTitle ?? "");
  const [type, setType] = useState(event.type);
  const [jobId, setJobId] = useState(event.jobId ?? "");
  const [date, setDate] = useState(format(startDate, "yyyy-MM-dd"));
  const [start, setStart] = useState(format(startDate, "HH:mm"));
  const [end, setEnd] = useState(format(endDate, "HH:mm"));
  const [assignedToId, setAssignedToId] = useState(
    role === "EMPLOYEE" ? currentUserId : event.assignedToId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const startsAt = new Date(`${date}T${start}:00`);
    const endsAt = new Date(`${date}T${end}:00`);
    if (!(endsAt > startsAt)) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || null,
        type,
        jobId: jobId || null,
        assignedToId: assignedToId || null,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update the event.");
      return;
    }
    onDone();
  }

  async function remove() {
    const warning = event.type === "job" && event.jobId
      ? "Delete this job event? The linked job schedule will be updated too."
      : "Delete this event?";
    if (!window.confirm(warning)) return;

    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not delete the event.");
      return;
    }
    onDone();
  }

  const fieldStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <div>
            <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>Edit event</h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textFaint }}>{event.title}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <Field label="Title (optional)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Falls back to job title" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none capitalize" style={fieldStyle}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Job (optional)">
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="">— none —</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="End">
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
          </div>

          {role !== "EMPLOYEE" && (
            <Field label="Assign to (optional)">
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="">— unassigned —</option>
                {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          )}

          {event.type === "job" && event.jobId && (
            <p className="text-[11px]" style={{ color: COLORS.textFaint }}>Changes to this linked job event also update the job schedule and crew assignment.</p>
          )}

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex items-center justify-between gap-2 mt-1">
            <button type="button" onClick={remove} disabled={deleting || saving} className="rounded-md px-3 py-2 text-sm font-medium flex items-center gap-1.5 disabled:opacity-60" style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}>
              <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
              <button type="submit" disabled={saving || deleting} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>
      {children}
    </label>
  );
}
