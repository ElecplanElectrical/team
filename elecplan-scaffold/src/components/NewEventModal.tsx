"use client";

import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { COLORS, FONTS, ON_ACCENT, EVENT_TYPES } from "@/lib/theme";

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
  const allowedTypes = crewOnly ? EVENT_TYPES.filter((t) => t !== "job") : EVENT_TYPES;
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(crewOnly ? "call" : "job");
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [assignedToId, setAssignedToId] = useState(crewOnly ? currentUserId : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(sendConfirmation: boolean) {
    if (saving) return;
    setError(null);
    const startsAt = new Date(`${date}T${start}:00`);
    const endsAt = new Date(`${date}T${end}:00`);
    if (!(endsAt > startsAt)) {
      setError("End time must be after start time.");
      return;
    }
    if (sendConfirmation && (!jobId || type !== "job")) {
      setError("Select a linked job before sending a client confirmation.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || null,
        type,
        jobId: crewOnly ? null : jobId || null,
        assignedToId: crewOnly ? currentUserId : assignedToId || null,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });

    if (!res.ok) {
      setSaving(false);
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the event. Check the details and try again.");
      return;
    }

    if (sendConfirmation && jobId) {
      const textRes = await fetch(`/api/jobs/${jobId}/confirmation`, { method: "POST" });
      if (!textRes.ok) {
        const body = await textRes.json().catch(() => null);
        window.alert(`Event created, but the client text was not sent. ${body?.error ?? "Check SMS configuration and the client phone number."}`);
      } else {
        window.alert("Event created and client confirmation text sent.");
      }
    }

    setSaving(false);
    onDone();
  }

  const fieldStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  const canTextClient = !crewOnly && type === "job" && Boolean(jobId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <div>
            <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New event</h2>
            {crewOnly && <p className="text-xs mt-0.5" style={{ color: COLORS.textFaint }}>Personal calendar item. Job scheduling is managed by admins and supervisors.</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void save(false); }} className="p-5 flex flex-col gap-3">
          <Field label="Title (optional)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Supplier call" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <div className={crewOnly ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none capitalize" style={fieldStyle}>
                {allowedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            {!crewOnly && (
              <Field label="Job (optional)">
                <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                  <option value="">— none —</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </Field>
            )}
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

          {!crewOnly && (
            <Field label="Assign to (optional)">
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="">— unassigned —</option>
                {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          )}

          {canTextClient && <p className="text-[11px]" style={{ color: COLORS.textFaint }}>Client texts are always manual. “Create & text client” sends one confirmation using the linked job’s client phone number.</p>}
          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-2 mt-1 flex-wrap">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
            {canTextClient && (
              <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5" style={{ border: `1px solid ${COLORS.accent}`, color: COLORS.accent }}>
                <MessageSquareText size={14} /> Create & text client
              </button>
            )}
            <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>
              {saving ? "Saving…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>{children}</label>;
}
