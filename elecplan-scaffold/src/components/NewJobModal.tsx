"use client";

import { useRef, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Check, X } from "lucide-react";
import ClientNameInput from "@/components/ClientNameInput";
import { cleanClientName } from "@/lib/client-name";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export type JobClientOption = { id: string; name: string; address: string | null };
export type JobCrewOption = { id: string; name: string; role: string };

type Props = {
  clients: JobClientOption[];
  crew: JobCrewOption[];
  onClose: () => void;
  onDone: () => void;
  initialClientId?: string;
  initialAddress?: string;
};

export default function NewJobModal({ clients, crew, onClose, onDone, initialClientId, initialAddress }: Props) {
  // Only preselect when opened from a specific client's page, never an arbitrary first client.
  const initialClient = clients.find((client) => client.id === initialClientId);
  const [clientOptions, setClientOptions] = useState(clients);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(initialClient?.id ?? "");
  const [clientName, setClientName] = useState(initialClient?.name ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [crewIds, setCrewIds] = useState<string[]>([]);
  const [status, setStatus] = useState("SCHEDULED");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  function close() { if (!submitting.current) onClose(); }
  function toggleCrew(id: string) {
    setCrewIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setError(null);
    if (!title.trim() || !cleanClientName(clientName)) return setError("Job title and client name are required.");
    if (Boolean(scheduledStart) !== Boolean(scheduledEnd)) return setError("Enter both a scheduled start and end, or leave both blank.");
    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) return setError("Scheduled end must be after the start time.");
    submitting.current = true;
    setSaving(true);
    try {
      // One request saves client + job + optional calendar event together.
      const res = await fetch("/api/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), ...(clientId ? { clientId } : { clientName: cleanClientName(clientName) }),
          address: address.trim(), crewIds, status,
          scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (Array.isArray(body?.clients)) {
          const extra: JobClientOption[] = body.clients.filter((client: { id?: unknown; name?: unknown }) =>
            client && typeof client.id === "string" && typeof client.name === "string")
            .map((client: { id: string; name: string }) => ({ ...client, address: null }));
          setClientOptions((current) => Array.from(new Map([...current, ...extra].map((client) => [client.id, client])).values()));
        }
        setError(res.status === 401 ? "Your sign-in has expired. Sign in again before saving." : body?.error ?? "Could not create the job.");
        return;
      }
      onDone();
    } catch {
      // A dropped response may follow a successful save. Never retry a write automatically.
      setError("Connection interrupted. Check Jobs before retrying so you do not add the job twice.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const field = { boxShadow: "var(--ep-inset-shadow)", background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const inputClass = "h-12 w-full rounded-lg px-3 text-base outline-none md:h-11 md:text-sm";
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={close}>
    <section role="dialog" aria-modal="true" aria-label="New job" className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden md:h-auto md:max-h-[92vh] md:rounded-2xl"
      style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(event) => event.stopPropagation()}>
      <header className="flex shrink-0 items-start gap-3 border-b px-4 py-3 md:px-5 md:py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan }}><BriefcaseBusiness size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>New job</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Select one or more workers for this job.</p></div>
        <button type="button" aria-label="Close new job" disabled={saving} onClick={close} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ color: UI.mute, ...UI.inset, background: UI.panelAlt }}><X size={18} /></button>
      </header>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" aria-busy={saving}>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <fieldset disabled={saving} className="grid min-w-0 gap-4 border-0 p-0 md:grid-cols-2">
            <Field label="Job title" className="md:col-span-2"><input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} className={inputClass} style={field} /></Field>
            <ClientNameInput clients={clientOptions} name={clientName} selectedId={clientId} disabled={saving}
              onChange={(name, id) => { setClientName(name); setClientId(id); setAddress(""); setError(null); }} />
            <Field label="Assigned crew">
              <div className="max-h-52 overflow-auto rounded-lg p-2" style={field}>{crew.map((person) => {
                const selected = crewIds.includes(person.id);
                return <button key={person.id} type="button" onClick={() => toggleCrew(person.id)} className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                  style={{ background: selected ? "rgba(67,210,255,.16)" : UI.panelAlt, color: UI.text, border: `1px solid ${selected ? "rgba(67,210,255,.45)" : UI.borderSoft}` }}>
                  <span>{person.name}</span>{selected && <Check size={16} style={{ color: UI.cyan }} />}
                </button>;
              })}</div>
              <span className="text-[11px]" style={{ color: UI.faint }}>{crewIds.length ? `${crewIds.length} selected` : "No one selected"}</span>
            </Field>
            <Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass} style={field}>
              <option value="QUOTED">Quoted</option><option value="SCHEDULED">Scheduled</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETE">Complete</option><option value="INVOICED">Invoiced</option>
            </select></Field>
            <div className="hidden md:block" />
            <Field label="Scheduled start"><input type="datetime-local" value={scheduledStart} onChange={(event) => setScheduledStart(event.target.value)} className={inputClass} style={field} /></Field>
            <Field label="Scheduled end"><input type="datetime-local" value={scheduledEnd} onChange={(event) => setScheduledEnd(event.target.value)} className={inputClass} style={field} /></Field>
            <div className="flex gap-2 rounded-xl p-3 md:col-span-2" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><CalendarDays size={15} style={{ color: UI.cyan }} /><p className="text-xs" style={{ color: UI.faint }}>Adding both times places the job on the calendar.</p></div>
            <Field label="Notes" className="md:col-span-2"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={2000} className="w-full resize-none rounded-lg px-3 py-2.5 text-base outline-none md:text-sm" style={field} /></Field>
          </fieldset>
        </div>
        <div className="shrink-0 border-t px-4 pt-3 md:px-5" style={{ borderColor: UI.borderSoft, paddingBottom: "max(12px, env(safe-area-inset-bottom))", ...UI.raised, background: UI.panel }}>
          {error && <p role="alert" className="mb-3 text-sm" style={{ color: UI.red }}>{error}</p>}
          <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
            <button type="button" disabled={saving} onClick={close} className="rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60" style={{ ...UI.inset, background: UI.panelAlt, color: UI.mute }}>Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60" style={{ ...UI.primary, color: UI.activeText }}>{saving ? "Saving..." : "Create job"}</button>
          </div>
        </div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>;
}
