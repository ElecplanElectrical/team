"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImageIcon, LockKeyhole, MapPin, Plus, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";

type ProjectPhoto = { id: string; fileUrl: string; uploadedAt: string; job: string; address: string; client: string };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72", orange: "#ff9f1c" };

export default function ProjectsView({
  photos,
  jobs,
  canDelete,
}: {
  photos: ProjectPhoto[];
  jobs: { id: string; title: string }[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true); setError(null);
    const form = new FormData();
    form.set("jobId", jobId);
    form.set("file", file);
    const res = await fetch("/api/projects", { method: "POST", body: form });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not add project photo."); return; }
    setJobId(""); setFile(null); setShowForm(false); router.refresh();
  }

  async function deletePhoto(photo: ProjectPhoto) {
    if (!window.confirm(`Delete this ${photo.job} project photo? This permanently removes the managed file.`)) return;
    setDeletingId(photo.id);
    setError(null);
    const res = await fetch(`/api/projects/${photo.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not delete project photo.");
      return;
    }
    router.refresh();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const uploadButton = <button type="button" onClick={() => setShowForm((value) => !value)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> Upload photo</button>;

  return <>
    <TopBar title="Past Projects" subtitle="Completed work and project photo archive" rightSlot={uploadButton} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Project photos" value={String(photos.length)} /><Metric label="Jobs represented" value={String(new Set(photos.map((photo) => photo.job)).size)} /><Metric label="Clients represented" value={String(new Set(photos.map((photo) => photo.client)).size)} /></div>

        <div className="flex gap-3 rounded-xl px-4 py-3 text-xs leading-5" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><LockKeyhole size={17} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><span>Private photo storage is ready. JPG, PNG and WebP files are allowed up to 10 MB and are served only through authenticated links.</span></div>

        {showForm && <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-2" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">Select job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
          <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
          {error && <p className="md:col-span-2 text-xs" style={{ color: UI.red }}>{error}</p>}
          <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving || !file} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Uploading…" : "Upload photo"}</button></div>
        </form>}

        {error && !showForm && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><img src={photo.fileUrl} alt={`${photo.job} project`} className="aspect-[4/3] w-full object-cover" loading="lazy" /><div className="p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><ImageIcon size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" style={{ color: UI.text }}>{photo.job}</p><p className="mt-1 text-xs" style={{ color: UI.mute }}>{photo.client}</p></div></div><p className="mt-3 flex items-center gap-1.5 truncate text-xs" style={{ color: UI.faint }}><MapPin size={12} className="shrink-0" /> {photo.address}</p><div className="mt-4 flex items-center gap-3"><span className="mr-auto text-[11px]" style={{ color: UI.faint }}>{new Date(photo.uploadedAt).toLocaleDateString("en-AU")}</span><a href={photo.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: UI.cyan }}>Open <ExternalLink size={12} /></a>{canDelete && <button type="button" disabled={deletingId === photo.id} onClick={() => void deletePhoto(photo)} className="inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ color: UI.red }}><Trash2 size={12} /> Delete</button>}</div></div></article>)}
          {photos.length === 0 && <div className="rounded-xl px-5 py-14 text-center text-sm sm:col-span-2 xl:col-span-3" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.faint }}>No project photos archived yet.</div>}
        </div>
      </div>
    </div>
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><p className="text-[11px]" style={{ color: UI.faint }}>{label}</p><p className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</p></div>; }
