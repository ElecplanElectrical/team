"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, ImageIcon, MapPin, Plus, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";

type UploadTicket = { uploadUrl: string; uploadHeaders: Record<string, string>; commitToken: string };
type ProjectPhoto = { id: string; fileUrl: string; uploadedAt: string; job: string; address: string; client: string };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", red: "#ff5e72", orange: "#ff9f1c" };

export default function ProjectsView({
  photos,
  jobs,
  canDelete,
  storageReady,
  canConfigureStorage,
}: {
  photos: ProjectPhoto[];
  jobs: { id: string; title: string }[];
  canDelete: boolean;
  storageReady: boolean;
  canConfigureStorage: boolean;
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
    if (!storageReady) {
      setError("Private storage is not configured yet.");
      return;
    }
    if (!file) return;
    setSaving(true); setError(null);
    const ticketRes = await fetch("/api/storage/upload-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "project-photos", fileName: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size }) });
    if (!ticketRes.ok) { const body = await ticketRes.json().catch(() => null); setSaving(false); setError(body?.error ?? "Could not prepare private upload."); return; }
    const ticket = await ticketRes.json() as UploadTicket;
    const uploadRes = await fetch(ticket.uploadUrl, { method: "PUT", headers: ticket.uploadHeaders, body: file });
    if (!uploadRes.ok) { setSaving(false); setError("Private photo upload failed. Please try again."); return; }
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, commitToken: ticket.commitToken }) });
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

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const uploadButton = storageReady ? (
    <button type="button" onClick={() => setShowForm((value) => !value)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> Upload photo</button>
  ) : (
    <button type="button" disabled className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold opacity-55" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}><Plus size={16} /> Upload unavailable</button>
  );

  return <>
    <TopBar title="Past Projects" subtitle="Completed work and project photo archive" rightSlot={uploadButton} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Project photos" value={String(photos.length)} /><Metric label="Jobs represented" value={String(new Set(photos.map((photo) => photo.job)).size)} /><Metric label="Clients represented" value={String(new Set(photos.map((photo) => photo.client)).size)} /></div>

        {storageReady ? (
          <div className="rounded-xl px-4 py-3 text-xs leading-5" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}>Private photo storage is ready. JPG, PNG and WebP files are allowed up to 10 MB and use short-lived signed access.</div>
        ) : (
          <div className="flex gap-3 rounded-xl px-4 py-4" style={{ background: "rgba(255,159,28,.07)", border: "1px solid rgba(255,159,28,.28)" }}>
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: UI.orange }} />
            <div><p className="text-sm font-semibold" style={{ color: UI.text }}>Project photo uploads are not configured yet</p><p className="mt-1 text-xs leading-5" style={{ color: UI.mute }}>{canConfigureStorage ? "The app is ready, but Railway production still needs the private S3-compatible bucket credentials. Upload controls are disabled until that is configured." : "Project photo uploads are temporarily unavailable. An Elecplan admin needs to finish private storage setup first."}</p></div>
          </div>
        )}

        {showForm && storageReady && <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-2" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">Select job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
          <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
          {error && <p className="md:col-span-2 text-xs" style={{ color: UI.red }}>{error}</p>}
          <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving || !file} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Uploading…" : "Upload photo"}</button></div>
        </form>}

        {error && !showForm && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.fileUrl} alt={`${photo.job} project`} className="aspect-[4/3] w-full object-cover" loading="lazy" /><div className="p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><ImageIcon size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" style={{ color: UI.text }}>{photo.job}</p><p className="mt-1 text-xs" style={{ color: UI.mute }}>{photo.client}</p></div></div><p className="mt-3 flex items-center gap-1.5 truncate text-xs" style={{ color: UI.faint }}><MapPin size={12} className="shrink-0" /> {photo.address}</p><div className="mt-4 flex items-center gap-3"><span className="mr-auto text-[11px]" style={{ color: UI.faint }}>{new Date(photo.uploadedAt).toLocaleDateString("en-AU")}</span><a href={photo.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: UI.cyan }}>Open <ExternalLink size={12} /></a>{canDelete && <button type="button" disabled={deletingId === photo.id} onClick={() => void deletePhoto(photo)} className="inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ color: UI.red }}><Trash2 size={12} /> Delete</button>}</div></div></article>)}
          {photos.length === 0 && <div className="rounded-xl px-5 py-14 text-center text-sm sm:col-span-2 xl:col-span-3" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.faint }}>No project photos archived yet.</div>}
        </div>
      </div>
    </div>
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><p className="text-[11px]" style={{ color: UI.faint }}>{label}</p><p className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</p></div>; }
