"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, ON_ACCENT } from "@/lib/theme";

type UploadTicket = {
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  commitToken: string;
};

export default function ProjectsView({
  photos,
  jobs,
}: {
  photos: { id: string; fileUrl: string; uploadedAt: string; job: string; address: string; client: string }[];
  jobs: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
        kind: "project-photos",
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
      setError("Private photo upload failed. Please try again.");
      return;
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, commitToken: ticket.commitToken }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not add project photo.");
      return;
    }
    setJobId("");
    setFile(null);
    setShowForm(false);
    router.refresh();
  }

  const field = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text } as const;

  return (
    <>
      <TopBar
        title="Past Projects"
        subtitle={`${photos.length} project photo${photos.length === 1 ? "" : "s"}`}
        rightSlot={
          <button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}>
            <Plus size={15} /> Upload project photo
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textMute }}>
          New project photos use Elecplan private storage and short-lived signed access. JPG, PNG and WebP files are allowed up to 10 MB.
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="rounded-md px-3 py-2 text-sm outline-none" style={field}>
              <option value="">Select job</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md px-3 py-2 text-sm outline-none" style={field} />
            {error && <p className="md:col-span-2 text-xs" style={{ color: COLORS.coral }}>{error}</p>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
              <button disabled={saving || !file} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Uploading…" : "Upload photo"}</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <article key={photo.id} className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.fileUrl} alt={`${photo.job} project`} className="w-full aspect-[4/3] object-cover" loading="lazy" />
              <div className="p-4">
                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{photo.job}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.textMute }}>{photo.client}</p>
                <p className="text-xs mt-1 truncate" style={{ color: COLORS.textFaint }}>{photo.address}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs" style={{ color: COLORS.textFaint }}>{new Date(photo.uploadedAt).toLocaleDateString("en-AU")}</span>
                  <a href={photo.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.accent }}>Open <ExternalLink size={12} /></a>
                </div>
              </div>
            </article>
          ))}
          {photos.length === 0 && <div className="sm:col-span-2 xl:col-span-3 rounded-lg px-5 py-10 text-center text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}>No project photos archived yet.</div>}
        </div>
      </div>
    </>
  );
}
