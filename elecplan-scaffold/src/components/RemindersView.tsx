"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, ON_ACCENT } from "@/lib/theme";

export default function RemindersView({ reminders }: { reminders: { id: string; title: string; dueDate: string | null; tag: string | null; completed: boolean }[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, dueDate: dueDate ? new Date(`${dueDate}T09:00:00`).toISOString() : null, tag }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create reminder.");
      return;
    }
    setTitle(""); setDueDate(""); setTag(""); setShowForm(false); router.refresh();
  }

  async function toggle(id: string, completed: boolean) {
    setUpdatingId(id);
    const res = await fetch(`/api/reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
    setUpdatingId(null);
    if (!res.ok) { setError("Could not update reminder."); return; }
    router.refresh();
  }

  const outstanding = reminders.filter((item) => !item.completed).length;
  const field = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text } as const;

  return (
    <>
      <TopBar title="Reminders" subtitle={`${outstanding} outstanding`} rightSlot={<button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> New reminder</button>} />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {showForm && <form onSubmit={submit} className="rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder" className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (optional)" className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
          {error && <p className="md:col-span-3 text-xs" style={{ color: COLORS.coral }}>{error}</p>}
          <div className="md:col-span-3 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create reminder"}</button></div>
        </form>}

        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          {reminders.map((item, index) => <div key={item.id} className="flex items-center gap-3 px-4 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none", opacity: item.completed ? 0.6 : 1 }}>
            <button disabled={updatingId === item.id} onClick={() => toggle(item.id, !item.completed)} aria-label={item.completed ? "Mark incomplete" : "Mark complete"} style={{ color: item.completed ? COLORS.accent : COLORS.textFaint }}>{item.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium" style={{ color: COLORS.text, textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</p><p className="text-xs mt-1" style={{ color: COLORS.textFaint }}>{item.tag || "General"}{item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString("en-AU")}` : ""}</p></div>
          </div>)}
          {reminders.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No reminders yet.</div>}
        </div>
      </div>
    </>
  );
}
