"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, LockKeyhole, Plus, Search, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";

export type DocumentRow = {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  job: string | null;
  uploadedAt: string;
};

type UploadTicket = { uploadUrl: string; uploadHeaders: Record<string, string>; commitToken: string };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72", orange: "#ff9f1c" };

export default function DocumentsView({
  documents,
  jobs,
  canDelete,
  storageReady,
}: {
  documents: DocumentRow[];
  jobs: { id: string; title: string }[];
  canDelete: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("General");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((doc) => [doc.name, doc.type, doc.job ?? ""].join(" ").toLowerCase().includes(needle));
  }, [documents, query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);
    if (!storageReady) {
      const form = new FormData();
      form.set("name", name);
      form.set("type", type);
      form.set("jobId", jobId);
      form.set("file", file);
      const response = await fetch("/api/documents", { method: "POST", body: form });
      setSaving(false);
      if (!response.ok) { const body = await response.json().catch(() => null); setError(body?.error ?? "Could not upload document."); return; }
      setName(""); setType("General"); setFile(null); setJobId(""); setShowForm(false); router.refresh();
      return;
    }
    const ticketRes = await fetch("/api/storage/upload-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "documents", fileName: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size }) });
    if (!ticketRes.ok) { const body = await ticketRes.json().catch(() => null); setSaving(false); setError(body?.error ?? "Could not prepare private upload."); return; }
    const ticket = await ticketRes.json() as UploadTicket;
    const uploadRes = await fetch(ticket.uploadUrl, { method: "PUT", headers: ticket.uploadHeaders, body: file });
    if (!uploadRes.ok) { setSaving(false); setError("Private file upload failed. Please try again."); return; }
    const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type, commitToken: ticket.commitToken, jobId: jobId || null }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not register document."); return; }
    setName(""); setType("General"); setFile(null); setJobId(""); setShowForm(false); router.refresh();
  }

  async function deleteDocument(doc: DocumentRow) {
    if (!window.confirm(`Delete ${doc.name}? This permanently removes the managed file.`)) return;
    setDeletingId(doc.id);
    setError(null);
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not delete document.");
      return;
    }
    router.refresh();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const uploadButton = <button type="button" onClick={() => setShowForm((value) => !value)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> Upload document</button>;

  return <>
    <TopBar title="Documents" subtitle="Securely manage company and job files" rightSlot={uploadButton} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Documents" value={String(documents.length)} /><Metric label="Job linked" value={String(documents.filter((doc) => doc.job).length)} /><Metric label="Global files" value={String(documents.filter((doc) => !doc.job).length)} /></div>

        <div className="flex gap-3 rounded-xl px-4 py-3 text-xs leading-5" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><LockKeyhole size={17} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><span>Private storage is ready. Files are tenant-protected and served only through authenticated links. PDF, JPG, PNG, WebP and text files are allowed up to 15 MB.</span></div>

        {showForm && <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-2" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field}>{["General","Certificate","Invoice","Quote","Plan","Photo","Safety","Employee"].map((item) => <option key={item}>{item}</option>)}</select>
          <input required type="file" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field} />
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">No linked job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
          {error && <p className="md:col-span-2 text-xs" style={{ color: UI.red }}>{error}</p>}
          <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving || !file} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Uploading…" : "Upload document"}</button></div>
        </form>}

        {error && !showForm && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

        <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div>
          <div className="hidden grid-cols-[minmax(220px,1.4fr)_150px_minmax(180px,1fr)_120px_120px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Document</span><span>Type</span><span>Linked job</span><span>Uploaded</span><span>Actions</span></div>
          {filtered.map((doc) => <div key={doc.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(220px,1.4fr)_150px_minmax(180px,1fr)_120px_120px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><FileText size={16} /></span><span className="truncate text-sm font-semibold" style={{ color: UI.text }}>{doc.name}</span></div><span className="text-xs" style={{ color: UI.mute }}>{doc.type}</span><span className="truncate text-xs" style={{ color: UI.mute }}>{doc.job ?? "Global document"}</span><span className="text-xs" style={{ color: UI.faint }}>{new Date(doc.uploadedAt).toLocaleDateString("en-AU")}</span><div className="flex items-center gap-3"><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: UI.cyan }}>Open <ExternalLink size={12} /></a>{canDelete && <button type="button" disabled={deletingId === doc.id} onClick={() => void deleteDocument(doc)} className="inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ color: UI.red }}><Trash2 size={12} /> Delete</button>}</div></div>)}
          {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No documents match your search.</div>}
          <div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {documents.length} documents</div>
        </section>
      </div>
    </div>
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><p className="text-[11px]" style={{ color: UI.faint }}>{label}</p><p className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</p></div>; }
