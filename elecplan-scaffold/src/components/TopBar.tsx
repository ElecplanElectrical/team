"use client";

import Link from "next/link";
import { Bell, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { EVENT_COLOR } from "@/lib/theme";

const UI = { bg: "rgba(3,16,31,.94)", panel: "#081b30", panelAlt: "#0a223b", border: "rgba(77,150,221,.23)", text: "#f6f9ff", mute: "#8fa5bf", faint: "#617993", blue: "#168dff", green: "#18d3a0", red: "#ff5e72" };
const CALENDAR_KEY = [
  ["job-scheduled", "Scheduled"],
  ["job-in-progress", "In progress"],
  ["job-complete", "Complete"],
] as const;

type Reminder = { id: string; title: string; completed: boolean };

export default function TopBar({ title, subtitle, rightSlot }: { title: string; subtitle?: string; rightSlot?: ReactNode }) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selected, setSelected] = useState<Reminder | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReminders() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/reminders", { cache: "no-store" });
    setLoading(false);
    if (!response.ok) { setError("Could not load tasks."); return; }
    const data = await response.json() as Reminder[];
    setReminders(data);
  }

  useEffect(() => {
    function close(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setOpen(false); setSelected(null); }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function openReminder(reminder: Reminder) {
    setSelected(reminder);
    setEditTitle(reminder.title);
    setError(null);
  }

  async function patchReminder(id: string, body: Record<string, unknown>) {
    setBusy(true); setError(null);
    const response = await fetch(`/api/reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!response.ok) { const data = await response.json().catch(() => null); setError(data?.error ?? "Could not update task."); return false; }
    await loadReminders();
    router.refresh();
    return true;
  }

  async function saveReminder() {
    if (!selected || !editTitle.trim()) { setError("Add a task name."); return; }
    const saved = await patchReminder(selected.id, { title: editTitle.trim() });
    if (saved) setSelected(null);
  }

  async function deleteReminder() {
    if (!selected || !window.confirm(`Delete “${selected.title}” permanently?`)) return;
    setBusy(true); setError(null);
    const response = await fetch(`/api/reminders/${selected.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) { setError("Could not delete task."); return; }
    setSelected(null);
    await loadReminders();
    router.refresh();
  }

  const activeCount = reminders.filter(reminder => !reminder.completed).length;

  return <header className="shrink-0 px-4 py-4 md:px-6 xl:px-7" style={{ background: UI.bg, borderBottom: `1px solid ${UI.border}`, backdropFilter: "blur(18px)" }}>
    <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em] md:text-2xl" style={{ color: UI.text }}>{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-xs md:text-sm" style={{ color: UI.mute }}>{subtitle}</p>}
        {title === "Calendar" && <div className="mt-2 flex max-w-full flex-wrap gap-x-4 gap-y-1.5">{CALENDAR_KEY.map(([type,label]) => { const c=EVENT_COLOR[type]; return <span key={type} className="inline-flex items-center gap-1.5 text-[10px] font-medium md:text-[11px]" style={{color:UI.mute}}><span className="h-2.5 w-2.5 rounded-full" style={{background:c.border}}/>{label}</span>; })}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative hidden lg:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.mute }} /><input aria-label="Search" placeholder="Search jobs, clients, quotes..." className="h-10 w-60 rounded-lg bg-transparent pl-9 pr-3 text-xs outline-none xl:w-72" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text }} /></div>
        {rightSlot}
        <Link href="/jobs" aria-label="Open jobs" className="hidden h-10 w-10 items-center justify-center rounded-lg sm:flex" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}><Plus size={18} /></Link>
        <div className="relative" ref={dropdownRef}>
          <button type="button" aria-label="To do list" aria-expanded={open} onClick={() => { const next = !open; setOpen(next); setSelected(null); if (next) void loadReminders(); }} className="relative flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><Bell size={17} />{activeCount > 0 && <span className="absolute right-1.5 top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white">{activeCount > 9 ? "9+" : activeCount}</span>}</button>
          {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl shadow-2xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{borderColor:UI.border}}><div><p className="text-sm font-semibold" style={{color:UI.text}}>To Do List</p><p className="text-[11px]" style={{color:UI.faint}}>{activeCount} to do</p></div>{selected && <button type="button" aria-label="Back to tasks" onClick={()=>setSelected(null)} className="rounded-md p-1.5" style={{color:UI.mute}}><X size={17}/></button>}</div>
            {selected ? <div className="space-y-3 p-4">
              <label className="block text-[11px] font-medium" style={{color:UI.mute}}>Task<input value={editTitle} onChange={event=>setEditTitle(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg px-3 text-sm outline-none" style={{background:"#041323",border:`1px solid ${UI.border}`,color:UI.text}}/></label>
              {error && <p className="text-xs" style={{color:UI.red}}>{error}</p>}
              <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>void saveReminder()} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{background:UI.blue,color:"white"}}><Pencil size={14}/>Save changes</button><button type="button" disabled={busy} onClick={async()=>{const done=await patchReminder(selected.id,{completed:!selected.completed});if(done)setSelected(null)}} className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:opacity-50" style={{background:"rgba(24,211,160,.12)",color:UI.green}}><Check size={14}/>{selected.completed?"Reopen":"Complete"}</button><button type="button" disabled={busy} onClick={()=>void deleteReminder()} className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:opacity-50" style={{background:"rgba(255,94,114,.12)",color:UI.red}}><Trash2 size={14}/>Delete</button></div>
            </div> : <div className="max-h-80 overflow-y-auto">
              {loading && <p className="px-4 py-8 text-center text-sm" style={{color:UI.faint}}>Loading tasks…</p>}
              {!loading && error && <p className="px-4 py-8 text-center text-sm" style={{color:UI.red}}>{error}</p>}
              {!loading && !error && reminders.length === 0 && <p className="px-4 py-8 text-center text-sm" style={{color:UI.faint}}>Nothing on the list.</p>}
              {!loading && reminders.map(reminder=><div key={reminder.id} className="flex items-center gap-2 border-b px-3 py-2" style={{borderColor:UI.border,opacity:reminder.completed?.58:1}}><button type="button" aria-label={reminder.completed?"Mark task not done":"Mark task done"} onClick={()=>void patchReminder(reminder.id,{completed:!reminder.completed})} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{color:reminder.completed?UI.green:UI.mute,border:`1px solid ${reminder.completed?UI.green:UI.border}`}}>{reminder.completed&&<Check size={15}/>}</button><button type="button" onClick={()=>openReminder(reminder)} className="min-w-0 flex-1 px-1 py-2 text-left"><span className="block truncate text-sm font-medium" style={{color:UI.text,textDecoration:reminder.completed?"line-through":"none"}}>{reminder.title}</span></button><button type="button" aria-label={`Edit ${reminder.title}`} onClick={()=>openReminder(reminder)} className="rounded-md p-2" style={{color:UI.mute}}><Pencil size={14}/></button></div>)}
            </div>}
            {!selected && <Link href="/reminders" onClick={()=>setOpen(false)} className="block px-4 py-3 text-center text-xs font-semibold" style={{color:UI.blue,background:UI.panelAlt}}>Open full to do list</Link>}
          </div>}
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-full text-xs font-semibold sm:flex" style={{ background: "linear-gradient(145deg,#0d3154,#071a2d)", border: `1px solid rgba(37,199,255,.35)`, color: "#d9f5ff" }}>EP</div>
      </div>
    </div>
  </header>;
}
