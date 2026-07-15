"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
  defaultDate: string; // YYYY-MM-DD
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("job");
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [assignedToId, setAssignedToId] = useState(
    role === "EMPLOYEE" ? currentUserId : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || null,
        type,
        jobId: jobId || null,
        assignedToId: assignedToId || null,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not create the event. Check the details and try again.");
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
        >
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: FONTS.display, color: COLORS.text }}
          >
            New event
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ color: COLORS.textMute }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <Field label="Title (optional)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Switchboard site visit"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={fieldStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none capitalize"
                style={fieldStyle}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job (optional)">
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              >
                <option value="">— none —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={fieldStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              />
            </Field>
            <Field label="End">
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              />
            </Field>
          </div>

          {role !== "EMPLOYEE" && (
            <Field label="Assign to (optional)">
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              >
                <option value="">— unassigned —</option>
                {employees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {error && (
            <p className="text-xs" style={{ color: COLORS.coral }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: COLORS.cardAlt, color: COLORS.textMute }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: COLORS.accent, color: ON_ACCENT }}
            >
              {saving ? "Saving…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
        {label}
      </span>
      {children}
    </label>
  );
}
