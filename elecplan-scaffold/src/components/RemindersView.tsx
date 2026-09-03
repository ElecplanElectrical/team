"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCircle2, Circle, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", green: "#18d3a0", orange: "#ff9f1c", red: "#ff5e72" };

type Reminder = { id: string; title: string; dueDate: string | null; tag: string | null; completed: boolean };

export default function RemindersView({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const outstanding = reminders.filter((item) => !item.completed).length;
  const completed = reminders.length - outstanding;
  const overdue = reminders.filter((item) => !item.completed && item.dueDate && new Date(item.dueDate) < new Date()).length;
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? reminders.filter((item) => [item.title, item.tag ?? ""].join(" ").toLowerCase().includes(needle)) : reminders; }, [reminders, query]);
  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const res = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, dueDate: dueDate ? new Date(`${dueDate}T09:00:00`).toISOString() : null, tag }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not create reminder."); return; }
    setTitle(""); setDueDate(""); setTag(""); setShowForm(false); router.refresh();
  }

  async function toggle(id: string, completedValue: boolean) {
    setUpdatingId(id); setError(null);
    const res = await fetch(`/api/reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: completedValue }) });
    setUpdatingId(null);
    if (!res.ok) { setError("Could not update reminder."); return; }
    router.refresh();
  }

  return <>
    <TopBar title="Reminders" subtitle="Follow-ups, due dates and operational tasks" rightSlot={<button type="button" onClick={() => setShowForm((value) => !value)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New reminder</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Outstanding" value={String(outstanding)} /><Metric label="Completed" value={String(completed)} /><Metric label="Overdue" value={String(overdue)} accent={overdue ? UI.red : undefined} /></div>
      {showForm && <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-3" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder" className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (optional)" className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />{error && <p className="md:col-span-3 text-xs" style={{ color: UI.red }}>{error}</p>}<div className="md:col-span-3 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute }}>Cancel</button><button disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create reminder"}</button></div></form>}
      {error && !showForm && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reminders…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div>{filtered.map((item) => { const isOverdue = !item.completed && item.dueDate && new Date(item.dueDate) < new Date(); return <div key={item.id} className="flex items-start gap-3 border-b px-4 py-4" style={{ borderColor: UI.borderSoft, opacity: item.completed ? 0.62 : 1 }}><button type="button" disabled={updatingId === item.id} onClick={() => void toggle(item.id, !item.completed)} aria-label={item.completed ? "Mark incomplete" : "Mark complete"} className="mt-0.5 disabled:opacity-40" style={{ color: item.completed ? UI.green : UI.cyan }}>{item.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold" style={{ color: UI.text, textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</p>{item.tag && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .10)", color: UI.cyan }}>{item.tag}</span>}{isOverdue && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(255,94,114,.10)", color: UI.red }}>Overdue</span>}</div><p className="mt-1 text-[11px]" style={{ color: isOverdue ? UI.red : UI.faint }}>{item.dueDate ? `Due ${new Date(item.dueDate).toLocaleDateString("en-AU")}` : "No due date"}</p></div><BellRing size={15} style={{ color: UI.faint }} /></div>; })}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No reminders match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {reminders.length} reminders</div></section>
    </div></div>
  </>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
