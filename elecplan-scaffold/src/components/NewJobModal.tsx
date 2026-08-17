"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type JobClientOption = { id: string; name: string; address: string | null };
export type JobCrewOption = { id: string; name: string; role: string };

export default function NewJobModal({
  clients,
  crew,
  onClose,
  onDone,
}: {
  clients: JobClientOption[];
  crew: JobCrewOption[];
  onClose: () => void;
  onDone: () => void;
}) {
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
    const selected = clients.find((c) => c.id === id);
    if (selected?.address) setAddress(selected.address);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !clientId || !address.trim()) {
      setError("Job title, client and address are required.");
      return;
    }

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
        className="w-full max-w-lg rounded-lg overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>
            New job
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3 max-h-[80vh] overflow-auto">
          <Field label="Job title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Switchboard upgrade" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} autoFocus />
          </Field>

          <Field label="Client">
            <select value={clientId} onChange={(e) => onClientChange(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {clients.length === 0 && <option value="">No clients available</option>}
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </Field>

          <Field label="Job address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, state" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Assigned to">
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="">Unassigned</option>
                {crew.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="QUOTED">Quoted</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETE">Complete</option>
                <option value="INVOICED">Invoiced</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Scheduled start">
              <input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="Scheduled end">
              <input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Access details, scope, materials, customer notes…" className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none" style={fieldStyle} />
          </Field>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
            <button type="submit" disabled={saving || clients.length === 0} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>
              {saving ? "Saving…" : "Create job"}
            </button>
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
