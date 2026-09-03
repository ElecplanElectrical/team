"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addHours, format, isValid, parse } from "date-fns";
import { BriefcaseBusiness, CalendarDays, MapPin, Plus, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { CAL_HOUR_END, CAL_HOUR_START, CAL_ROW_PX } from "@/lib/week";

type ClientOption = { id: string; name: string; address: string | null };
type CrewOption = { id: string; name: string; role: string };
type Slot = { start: string; end: string };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72" };

function localInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function CalendarQuickJobBridge({ weekStart, clients, crew, role }: { weekStart: string; clients: ClientOption[]; crew: CrewOption[]; role: Role }) {
  const [slot, setSlot] = useState<Slot | null>(null);
  const canCreate = role !== "EMPLOYEE";
  const weekDate = useMemo(() => new Date(`${weekStart}T00:00:00`), [weekStart]);

  useEffect(() => {
    if (!canCreate) return;
    function onCalendarClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest(".shadow-lg")) return;
      const column = target.closest<HTMLElement>("[data-day-column]");
      if (!column) return;
      const rect = column.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const visibleColumns = Array.from(document.querySelectorAll<HTMLElement>("[data-day-column]")).filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      });

      let day = weekDate;
      if (visibleColumns.length >= 7) {
        const index = visibleColumns.indexOf(column);
        if (index < 0) return;
        day = addDays(weekDate, index);
      } else {
        const mobileRoot = Array.from(column.parentElement?.parentElement?.parentElement?.parentElement?.children ?? []).length ? column.closest("div.md\\:hidden") : null;
        const label = mobileRoot?.querySelector<HTMLElement>(".px-3.py-2.text-xs.font-semibold")?.textContent?.trim();
        if (label) {
          const parsed = parse(`${label} ${weekDate.getFullYear()}`, "EEEE d MMMM yyyy", weekDate);
          if (isValid(parsed)) day = parsed;
        }
      }

      const offsetMinutes = Math.round((((event.clientY - rect.top) / CAL_ROW_PX) * 60) / 15) * 15;
      const minuteOfDay = Math.min(CAL_HOUR_END * 60 - 60, Math.max(CAL_HOUR_START * 60, CAL_HOUR_START * 60 + offsetMinutes));
      const start = new Date(day);
      start.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
      const end = addHours(start, 1);
      setSlot({ start: localInput(start), end: localInput(end) });
    }
    document.addEventListener("click", onCalendarClick);
    return () => document.removeEventListener("click", onCalendarClick);
  }, [canCreate, weekDate]);

  if (!slot) return null;
  return <QuickJobModal slot={slot} clients={clients} crew={crew} onClose={() => setSlot(null)} onDone={() => { setSlot(null); window.location.reload(); }} />;
}

function QuickJobModal({ slot, clients, crew, onClose, onDone }: { slot: Slot; clients: ClientOption[]; crew: CrewOption[]; onClose: () => void; onDone: () => void }) {
  const [newClient, setNewClient] = useState(clients.length === 0);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [scheduledStart, setScheduledStart] = useState(slot.start);
  const [scheduledEnd, setScheduledEnd] = useState(slot.end);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim() || !address.trim()) return setError("Job title and job site address are required.");
    if (!newClient && !clientId) return setError("Choose a client.");
    if (newClient && !clientName.trim()) return setError("Enter the new client's name.");
    if (new Date(scheduledEnd) <= new Date(scheduledStart)) return setError("Scheduled end must be after the start time.");
    setSaving(true);
    try {
      let resolvedClientId = clientId;
      if (newClient) {
        const clientResponse = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clientName.trim(), contactName: clientName.trim(), phone: clientPhone.trim() || null, email: clientEmail.trim() || null, address: null }) });
        const clientBody = await clientResponse.json().catch(() => null);
        if (!clientResponse.ok) throw new Error(clientBody?.error ?? "Could not create the client.");
        resolvedClientId = clientBody.id;
      }
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), clientId: resolvedClientId, address: address.trim(), assignedToId: assignedToId || null, status: "SCHEDULED", scheduledStart: new Date(scheduledStart).toISOString(), scheduledEnd: new Date(scheduledEnd).toISOString(), notes: notes.trim() || null }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Could not create the job.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the job.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-4 py-4 md:px-5" style={{ borderColor: UI.borderSoft }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><BriefcaseBusiness size={18} /></span><div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>Create job from calendar</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>The job and calendar booking are created together.</p></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: UI.panelAlt, color: UI.mute }}><X size={18} /></button></header>
      <form onSubmit={submit} className="min-h-0 overflow-y-auto px-4 py-4 md:px-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Job title" wide><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} placeholder="e.g. Garden maintenance" /></Field>
          <Field label="Client"><select value={newClient ? "__new__" : clientId} onChange={(event) => { if (event.target.value === "__new__") setNewClient(true); else { setNewClient(false); setClientId(event.target.value); } }} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="__new__">+ New client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
          <Field label="Assigned to"><select value={assignedToId} onChange={(event) => setAssignedToId(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">Unassigned</option>{crew.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>
          {newClient && <><Field label="Client name"><input value={clientName} onChange={(event) => setClientName(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field><Field label="Client phone"><input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field><Field label="Client email" wide><input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field></>}
          <Field label="Job / site address" wide><div className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={address} onChange={(event) => setAddress(event.target.value)} className="h-11 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} placeholder="Where the work is being done" /></div></Field>
          <Field label="Scheduled start"><input type="datetime-local" value={scheduledStart} onChange={(event) => setScheduledStart(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Scheduled end"><input type="datetime-local" value={scheduledEnd} onChange={(event) => setScheduledEnd(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <div className="md:col-span-2 flex gap-2 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><CalendarDays size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>Saving creates the job in Jobs, links it to the client, and places it on the Calendar.</p></div>
          <Field label="Notes" wide><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field>
        </div>
        {error && <p className="mt-4 rounded-lg px-3 py-2 text-xs" style={{ color: UI.red, background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.24)" }}>{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}><Plus size={16} />{saving ? "Saving…" : "Create job"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? "md:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
