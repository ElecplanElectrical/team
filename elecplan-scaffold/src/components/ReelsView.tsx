"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

const STATUSES = ["IDEA", "READY", "SCHEDULED", "PUBLISHED"] as const;

type Idea = {
  id: string;
  title: string;
  hook: string | null;
  platform: string;
  status: string;
  scheduledAt: string | null;
  publishedUrl: string | null;
  notes: string | null;
  createdAt: string;
};

export default function ReelsView({ ideas }: { ideas: Idea[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", hook: "", platform: "Instagram", status: "IDEA", scheduledAt: "", publishedUrl: "", notes: "" });

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, ideas.filter((i) => i.status === s).length])), [ideas]);

  async function createIdea(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const response = await fetch("/api/reels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!response.ok) return;
    setOpen(false);
    setForm({ title: "", hook: "", platform: "Instagram", status: "IDEA", scheduledAt: "", publishedUrl: "", notes: "" });
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    const response = await fetch(`/api/reels/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) router.refresh();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <TopBar title="Reels & content" />
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Content planner</h1>
            <p className="text-sm text-slate-500">Plan ideas and publishing status without connecting social accounts.</p>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">New content idea</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">{status}</div>
              <div className="mt-1 text-2xl font-semibold">{counts[status] ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {ideas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No content ideas yet.</div>
          ) : ideas.map((idea) => (
            <div key={idea.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{idea.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{idea.platform}</span>
                  </div>
                  {idea.hook && <p className="mt-1 text-sm text-slate-600">Hook: {idea.hook}</p>}
                  {idea.scheduledAt && <p className="mt-1 text-xs text-slate-500">Scheduled: {new Date(idea.scheduledAt).toLocaleString("en-AU")}</p>}
                  {idea.notes && <p className="mt-2 text-sm text-slate-500">{idea.notes}</p>}
                  {idea.publishedUrl && <a href={idea.publishedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline">Open published post</a>}
                </div>
                <select value={idea.status} onChange={(e) => setStatus(idea.id, e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={createIdea} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">New content idea</h2><button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">Close</button></div>
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <textarea placeholder="Hook / opening line" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2"><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>YouTube</option></select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <input type="url" placeholder="Published URL (optional)" value={form.publishedUrl} onChange={(e) => setForm({ ...form, publishedUrl: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <button disabled={saving} className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Save idea"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
