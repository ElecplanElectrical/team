"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, ON_ACCENT } from "@/lib/theme";

export type DocumentRow = {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  job: string | null;
  uploadedAt: string;
};

type UploadTicket = {
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  commitToken: string;
};

export default function DocumentsView({
  documents,
  jobs,
}: {
  documents: DocumentRow[];
  jobs: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("General");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);

    const ticketRes = await fetch("/api/storage/upload-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "documents",
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      }),
    });
    if (!ticketRes.ok) {
      const body = await ticketRes.json().catch(() => null);
      setSaving(false);
      setError(body?.error ?? "Could not prepare private upload.");
      return;
    }
    const ticket = await ticketRes.json() as UploadTicket;

    const uploadRes = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: ticket.uploadHeaders,
      body: file,
    });
    if (!uploadRes.ok) {
      setSaving(false);
      setError("Private file upload failed. Please try again.");
      return;
    }

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, commitToken: ticket.commitToken, jobId: jobId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not register document.");
      return;
    }
    setName("");
    setType("General");
    setFile(null);
    setJobId("");
    setShowForm(false);
    router.refresh();
  }

  const field = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  } as const;

  return (
    <>
      <TopBar
        title="Documents"
        subtitle={`${documents.length} registered file${documents.length === 1 ? "" : "s"}`}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold"
            style={{ background: COLORS.accent, color: ON_ACCENT }}
          >
            <Plus size={15} /> Upload document
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMute }}>
          New documents use Elecplan private storage with short-lived upload and download links. PDF, JPG, PNG, WebP and text files are allowed up to 15 MB.
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md px-3 py-2 text-sm outline-none" style={field}>
              {['General','Certificate','Invoice','Quote','Plan','Photo','Safety','Employee'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input required type="file" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-md px-3 py-2 text-sm outline-none" style={field}>
              <option value="">No linked job</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            {error && <p className="md:col-span-2 text-xs" style={{ color: COLORS.coral }}>{error}</p>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
              <button disabled={saving || !file} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Uploading…" : "Upload document"}</button>
            </div>
          </form>
        )}

        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          {documents.map((doc, index) => (
            <div key={doc.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_160px_1fr_120px] gap-2 md:gap-4 items-center px-4 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none" }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{doc.name}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.textFaint }}>{new Date(doc.uploadedAt).toLocaleDateString("en-AU")}</p>
              </div>
              <span className="text-xs" style={{ color: COLORS.textMute }}>{doc.type}</span>
              <span className="text-xs truncate" style={{ color: COLORS.textMute }}>{doc.job ?? "Global document"}</span>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: COLORS.accent }}>Open <ExternalLink size={13} /></a>
            </div>
          ))}
          {documents.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No documents uploaded yet.</div>}
        </div>
      </div>
    </>
  );
}
