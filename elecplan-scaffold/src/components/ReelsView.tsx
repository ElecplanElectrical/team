"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Plus, Search, Sparkles, X } from "lucide-react";
import TopBar from "@/components/TopBar";

const STATUSES = ["IDEA", "READY", "SCHEDULED", "PUBLISHED"] as const;
type Idea = { id: string; title: string; hook: string | null; platform: string; status: string; scheduledAt: string | null; publishedUrl: string | null; notes: string | null; createdAt: string };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", purple: "#8a5cf6", orange: "#ff9f1c", red: "#ff5e72" };

function statusStyle(status: string) {
  if (status === "PUBLISHED") return { bg: "rgba(25,211,162,.10)", fg: UI.green };
  if (status === "SCHEDULED") return { bg: "rgba(22,141,255,.12)", fg: UI.cyan };
  if (status === "READY") return { bg: "rgba(138,92,246,.12)", fg: "#b99cff" };
  return { bg: "rgba(255,159,28,.10)", fg: UI.orange };
}

export default function ReelsView({ ideas }: { ideas: Idea[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", hook: "", platform: "Instagram", status: "IDEA", scheduledAt: "", publishedUrl: "", notes: "" });
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, ideas.filter((i) => i.status === s).length])), [ideas]);
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? ideas.filter((idea) => [idea.title, idea.hook ?? "", idea.platform, idea.notes ?? ""].join(" ").toLowerCase().includes(needle)) : ideas; }, [ideas, query]);
  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  async function createIdea(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/reels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Could not save the content idea.");
        return;
      }
      setOpen(false);
      setForm({ title: "", hook: "", platform: "Instagram", status: "IDEA", scheduledAt: "", publishedUrl: "", notes: "" });
      router.refresh();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/reels/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Could not update the content status.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return <>
    <TopBar title="Reels & content" subtitle="Plan content without connecting social accounts" rightSlot={<button type="button" onClick={() => { setError(null); setOpen(true); }} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New content idea</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{STATUSES.map((status) => <Metric key={status} label={status.charAt(0) + status.slice(1).toLowerCase()} value={String(counts[status] ?? 0)} />)}</div>
      {error && !open && <div role="alert" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}><AlertTriangle size={15} />{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content ideas…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="grid gap-3 p-3 lg:grid-cols-2">{filtered.map((idea) => { const style = statusStyle(idea.status); return <article key={idea.id} className="rounded-xl p-4" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><Sparkles size={16} /></span><div className="min-w-0"><h2 className="truncate text-sm font-semibold" style={{ color: UI.text }}>{idea.title}</h2><p className="mt-1 text-[11px]" style={{ color: UI.faint }}>{idea.platform}</p></div></div><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg }}>{idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}</span></div>{idea.hook && <p className="mt-4 text-sm leading-6" style={{ color: UI.mute }}><strong style={{ color: UI.text }}>Hook:</strong> {idea.hook}</p>}{idea.notes && <p className="mt-2 text-xs leading-5" style={{ color: UI.faint }}>{idea.notes}</p>}<div className="mt-4 flex flex-wrap items-center gap-2"><select aria-label={`Update ${idea.title} status`} value={idea.status} disabled={busyId === idea.id} onChange={(e) => void setStatus(idea.id, e.target.value)} className="rounded-lg px-2.5 py-2 text-xs outline-none disabled:opacity-60" style={field}>{STATUSES.map((status) => <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}</select>{idea.scheduledAt && <span className="text-[11px]" style={{ color: UI.faint }}>{new Date(idea.scheduledAt).toLocaleString("en-AU")}</span>}{idea.publishedUrl && <a href={idea.publishedUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold" style={{ color: UI.cyan }}>Open post <ExternalLink size={12} /></a>}</div></article>; })}{filtered.length === 0 && <div className="rounded-xl p-10 text-center text-sm lg:col-span-2" style={{ background: UI.panelAlt, color: UI.faint }}>No content ideas match your search.</div>}</div></section>
    </div></div>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onMouseDown={() => setOpen(false)} role="presentation"><form onSubmit={createIdea} onMouseDown={(e) => e.stopPropagation()} aria-busy={saving} className="w-full max-w-lg overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} role="dialog" aria-modal="true" aria-labelledby="new-content-title"><div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><div><h2 id="new-content-title" className="text-lg font-semibold" style={{ color: UI.text }}>New content idea</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Plan the content only — no social accounts are connected.</p></div><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-1" style={{ color: UI.mute }}><X size={18} /></button></div><div className="max-h-[82vh] space-y-4 overflow-auto p-5"><input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={field} autoFocus /><textarea placeholder="Hook / opening line" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={field} /><div className="grid grid-cols-2 gap-3"><select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="rounded-lg px-3 py-2.5 outline-none" style={field}><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>YouTube</option></select><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg px-3 py-2.5 outline-none" style={field}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={field} /><input type="url" placeholder="Published URL (optional)" value={form.publishedUrl} onChange={(e) => setForm({ ...form, publishedUrl: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={field} /><textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg px-3 py-2.5 outline-none" style={field} />{error && <div role="alert" className="flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Save idea"}</button></div></div></form></div>}
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</div></div>; }
