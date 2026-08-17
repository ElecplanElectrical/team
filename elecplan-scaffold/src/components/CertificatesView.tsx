"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileCheck2, Plus, Search, X } from "lucide-react";
import TopBar from "@/components/TopBar";

const STATUSES = ["PENDING", "ISSUED", "EXPIRING"] as const;
type CertificateStatus = (typeof STATUSES)[number];

export type CertificateRow = { id: string; certNumber: string; type: string; status: CertificateStatus; issuedDate: string | null; jobTitle: string; jobAddress: string; electricianName: string; licenseNumber: string | null };
type JobOption = { id: string; title: string; address: string };
type ElectricianOption = { id: string; name: string; licenseNumber: string | null };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", orange: "#ff9f1c", red: "#ff5e72" };

const statusLabel = (status: CertificateStatus) => status.charAt(0) + status.slice(1).toLowerCase();

function statusStyle(status: CertificateStatus) {
  if (status === "ISSUED") return { bg: "rgba(25,211,162,.10)", fg: UI.green, border: "rgba(25,211,162,.24)" };
  if (status === "EXPIRING") return { bg: "rgba(255,159,28,.10)", fg: UI.orange, border: "rgba(255,159,28,.24)" };
  return { bg: "rgba(22,141,255,.11)", fg: UI.cyan, border: "rgba(37,199,255,.24)" };
}

export default function CertificatesView({ certificates, jobs, electricians }: { certificates: CertificateRow[]; jobs: JobOption[]; electricians: ElectricianOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const pending = certificates.filter((c) => c.status === "PENDING").length;
  const issued = certificates.filter((c) => c.status === "ISSUED").length;
  const attention = certificates.filter((c) => c.status === "EXPIRING").length;
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? certificates.filter((c) => [c.certNumber, c.type, c.jobTitle, c.jobAddress, c.electricianName].join(" ").toLowerCase().includes(needle)) : certificates; }, [certificates, query]);

  async function updateStatus(id: string, status: CertificateStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not update certificate.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  return <>
    <TopBar title="Certificates" subtitle="Electrical compliance records and issue status" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New certificate</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-4"><Metric label="Total" value={String(certificates.length)} /><Metric label="Pending" value={String(pending)} /><Metric label="Issued" value={String(issued)} /><Metric label="Attention" value={String(attention)} accent={attention ? UI.orange : undefined} /></div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}><AlertTriangle size={15} />{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search certificates…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="hidden grid-cols-[140px_minmax(220px,1.3fr)_180px_minmax(180px,1fr)_130px_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] lg:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Certificate</span><span>Job</span><span>Type</span><span>Electrician</span><span>Issued</span><span>Status</span></div>{filtered.map((certificate) => { const style = statusStyle(certificate.status); return <div key={certificate.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 lg:grid-cols-[140px_minmax(220px,1.3fr)_180px_minmax(180px,1fr)_130px_150px] lg:items-center lg:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><FileCheck2 size={16} /></span><span className="text-xs font-semibold" style={{ color: UI.text }}>{certificate.certNumber}</span></div><div className="min-w-0"><div className="truncate text-sm font-semibold" style={{ color: UI.text }}>{certificate.jobTitle}</div><div className="mt-1 truncate text-[11px]" style={{ color: UI.faint }}>{certificate.jobAddress}</div></div><span className="text-xs" style={{ color: UI.mute }}>{certificate.type}</span><div className="min-w-0"><div className="truncate text-xs" style={{ color: UI.text }}>{certificate.electricianName}</div><div className="mt-1 truncate text-[11px]" style={{ color: certificate.licenseNumber ? UI.faint : UI.red }}>{certificate.licenseNumber ? `Lic. ${certificate.licenseNumber}` : "No licence recorded"}</div></div><span className="text-xs" style={{ color: UI.mute }}>{certificate.issuedDate ? new Date(certificate.issuedDate).toLocaleDateString("en-AU") : "Not issued"}</span><div className="flex items-center gap-2"><span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{statusLabel(certificate.status)}</span><select aria-label={`Update ${certificate.certNumber} status`} value={certificate.status} disabled={updatingId === certificate.id} onChange={(e) => void updateStatus(certificate.id, e.target.value as CertificateStatus)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div></div>; })}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No certificates match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {certificates.length} certificates</div></section>
    </div></div>
    {showNew && <NewCertificateModal jobs={jobs} electricians={electricians} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewCertificateModal({ jobs, electricians, onClose, onDone }: { jobs: JobOption[]; electricians: ElectricianOption[]; onClose: () => void; onDone: () => void }) {
  const [certNumber, setCertNumber] = useState("");
  const [type, setType] = useState("Certificate of Electrical Safety");
  const [jobId, setJobId] = useState("");
  const [electricianId, setElectricianId] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [status, setStatus] = useState<CertificateStatus>("PENDING");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!jobId || !electricianId) return setError("Choose a job and issuing electrician.");
    const electrician = electricians.find((item) => item.id === electricianId);
    if (!electrician?.licenseNumber) return setError("The issuing electrician must have a licence number recorded in Employees first.");
    if (status !== "PENDING" && !issuedDate) return setError("Add an issued date before marking this certificate as issued or expiring.");

    setSaving(true);
    try {
      const res = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certNumber, type, jobId, electricianId, issuedDate: issuedDate ? new Date(`${issuedDate}T12:00:00`).toISOString() : null, status }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not create certificate.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation"><section className="w-full max-w-lg overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-certificate-title"><div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><div><h2 id="new-certificate-title" className="text-base font-semibold" style={{ color: UI.text }}>New certificate</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Record a job compliance certificate.</p></div><button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button></div><form onSubmit={submit} className="flex max-h-[82vh] flex-col gap-3 overflow-auto p-5" aria-busy={saving}><Field label="Certificate number"><input required value={certNumber} onChange={(e) => setCertNumber(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field} placeholder="e.g. COES-2026-001" autoFocus /></Field><Field label="Certificate type"><select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option>Certificate of Electrical Safety</option><option>Certificate of Compliance</option><option>Other</option></select></Field><Field label="Job"><select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">Choose job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.address}</option>)}</select></Field><Field label="Issuing electrician"><select required value={electricianId} onChange={(e) => setElectricianId(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field}><option value="">Choose electrician</option>{electricians.map((electrician) => <option key={electrician.id} value={electrician.id}>{electrician.name}{electrician.licenseNumber ? ` — ${electrician.licenseNumber}` : " — no licence recorded"}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Issued date"><input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value as CertificateStatus)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={field}>{STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></Field></div>{error && <div role="alert" className="flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create certificate"}</button></div></form></section></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
