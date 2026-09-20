"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";

import { PORTAL_UI as UI } from "@/lib/carbon-theme";
type Task = { id: string; title: string; completed: boolean };

export default function RemindersView({ reminders }: { reminders: Task[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const toDo = reminders.filter(task => !task.completed).length;
  const done = reminders.length - toDo;
  const filtered = useMemo(() => { const search = query.trim().toLowerCase(); return search ? reminders.filter(task => task.title.toLowerCase().includes(search)) : reminders; }, [reminders, query]);
  const field = { ...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  async function createTask(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setSaving(false);
    if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.error ?? "Could not create task."); return; }
    setTitle(""); setShowForm(false); router.refresh();
  }

  async function updateTask(id: string, changes: Record<string, unknown>) {
    setUpdatingId(id); setError(null);
    const response = await fetch(`/api/reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    setUpdatingId(null);
    if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.error ?? "Could not update task."); return false; }
    router.refresh(); return true;
  }

  async function deleteTask(id: string, taskTitle: string) {
    if (!window.confirm(`Delete “${taskTitle}” permanently?`)) return;
    setUpdatingId(id); setError(null);
    const response = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setUpdatingId(null);
    if (!response.ok) { setError("Could not delete task."); return; }
    setEditing(null); router.refresh();
  }

  function startEdit(task: Task) { setEditing(task); setEditTitle(task.title); setShowForm(false); setError(null); }
  async function saveEdit(event: React.FormEvent) { event.preventDefault(); if (!editing) return; if (await updateTask(editing.id, { title: editTitle })) setEditing(null); }

  return <>
    <TopBar title="To Do List" subtitle="Tasks to get done" rightSlot={<button type="button" onClick={() => { setShowForm(value => !value); setEditing(null); }} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ ...UI.primary, color: UI.activeText }}><Plus size={16}/> New task</button>}/>
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "var(--ep-main)" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="To do" value={String(toDo)}/><Metric label="Done" value={String(done)} accent={UI.green}/><Metric label="Total" value={String(reminders.length)}/></div>
      {showForm && <form onSubmit={createTask} className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><input autoFocus required value={title} onChange={event => setTitle(event.target.value)} placeholder="What needs to be done?" className="h-11 min-w-0 flex-1 rounded-lg px-3 text-sm outline-none" style={field}/><div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ ...UI.inset, background: UI.panelAlt, color: UI.mute }}>Cancel</button><button disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ ...UI.primary, color: UI.activeText }}>{saving ? "Adding…" : "Add task"}</button></div></form>}
      {editing && <form onSubmit={saveEdit} className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><input autoFocus required value={editTitle} onChange={event => setEditTitle(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg px-3 text-sm outline-none" style={field}/><div className="flex flex-wrap gap-2"><button type="button" disabled={updatingId === editing.id} onClick={() => void deleteTask(editing.id, editing.title)} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: "rgba(255,94,114,.12)", color: UI.red }}><Trash2 size={15}/>Delete</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2.5 text-sm" style={{ ...UI.inset, background: UI.panelAlt, color: UI.mute }}>Cancel</button><button disabled={updatingId === editing.id} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ ...UI.primary, color: UI.activeText }}>Save changes</button></div></form>}
      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tasks…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field}/></div></div>
        {filtered.map(task => <div key={task.id} className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: UI.borderSoft, opacity: task.completed ? .62 : 1 }}><button type="button" disabled={updatingId === task.id} onClick={() => void updateTask(task.id, { completed: !task.completed })} aria-label={task.completed ? "Mark task not done" : "Mark task done"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40" style={{ color: task.completed ? UI.green : UI.cyan, border: `1px solid ${task.completed ? UI.green : UI.border}` }}>{task.completed ? <Check size={17}/> : <Circle size={17}/>}</button><button type="button" onClick={() => startEdit(task)} className="min-w-0 flex-1 py-2 text-left"><span className="block truncate text-sm font-semibold" style={{ color: UI.text, textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span></button><button type="button" onClick={() => startEdit(task)} aria-label={`Edit ${task.title}`} className="rounded-md p-2 transition hover:bg-white/5" style={{ color: UI.mute }}><Pencil size={16}/></button><button type="button" disabled={updatingId === task.id} onClick={() => void deleteTask(task.id, task.title)} aria-label={`Delete ${task.title}`} className="rounded-md p-2 transition hover:bg-red-500/10 disabled:opacity-40" style={{ color: UI.red }}><Trash2 size={16}/></button></div>)}
        {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>Nothing on the list.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {reminders.length} tasks</div></section>
    </div></div>
  </>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
