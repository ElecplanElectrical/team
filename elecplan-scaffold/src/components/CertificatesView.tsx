"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";
import TopBar from "@/components/TopBar";

const STATUSES = ["PENDING", "ISSUED", "EXPIRING"] as const;
type CertificateStatus = (typeof STATUSES)[number];

export type CertificateRow = {
  id: string;
  certNumber: string;
  type: string;
  status: CertificateStatus;
  issuedDate: string | null;
  jobTitle: string;
  jobAddress: string;
  electricianName: string;
  licenseNumber: string | null;
};

type JobOption = { id: string; title: string; address: string };
type ElectricianOption = { id: string; name: string; licenseNumber: string | null };

function statusLabel(status: CertificateStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function CertificatesView({
  certificates,
  jobs,
  electricians,
}: {
  certificates: CertificateRow[];
  jobs: JobOption[];
  electricians: ElectricianOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = certificates.filter((c) => c.status === "PENDING").length;
  const issued = certificates.filter((c) => c.status === "ISSUED").length;
  const attention = certificates.filter((c) => c.status === "EXPIRING").length;

  async function updateStatus(id: string, status: CertificateStatus) {
    setUpdatingId(id);
    setError(null);
    const res = await fetch(`/api/certificates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update certificate.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <TopBar
        title="Certificates"
        subtitle={`${pending} pending · ${issued} issued · ${attention} need attention`}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold"
            style={{ background: COLORS.accent, color: ON_ACCENT }}
          >
            <Plus size={15} /> New certificate
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {error && (
          <div className="rounded-md px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Metric label="Total" value={String(certificates.length)} />
          <Metric label="Pending" value={String(pending)} />
          <Metric label="Issued" value={String(issued)} />
          <Metric label="Attention" value={String(attention)} />
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.card }}>
          <div className="hidden lg:grid grid-cols-[130px_1.2fr_1.2fr_1fr_130px_150px] gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
            {['CERTIFICATE','JOB','TYPE','ELECTRICIAN','ISSUED','STATUS'].map((h) => (
              <span key={h} className="text-xs font-semibold" style={{ color: COLORS.textFaint }}>{h}</span>
            ))}
          </div>

          {certificates.map((certificate, i) => (
            <div
              key={certificate.id}
              className="grid grid-cols-1 lg:grid-cols-[130px_1.2fr_1.2fr_1fr_130px_150px] gap-2 lg:gap-3 items-center px-4 lg:px-5 py-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}
            >
              <span className="text-xs font-semibold" style={{ fontFamily: FONTS.mono, color: COLORS.text }}>{certificate.certNumber}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{certificate.jobTitle}</div>
                <div className="text-xs truncate" style={{ color: COLORS.textFaint }}>{certificate.jobAddress}</div>
              </div>
              <span className="text-xs" style={{ color: COLORS.textMute }}>{certificate.type}</span>
              <div className="min-w-0">
                <div className="text-sm truncate" style={{ color: COLORS.text }}>{certificate.electricianName}</div>
                <div className="text-xs truncate" style={{ color: certificate.licenseNumber ? COLORS.textFaint : COLORS.coral }}>
                  {certificate.licenseNumber ? `Lic. ${certificate.licenseNumber}` : "No licence recorded"}
                </div>
              </div>
              <span className="text-xs" style={{ color: COLORS.textMute }}>
                {certificate.issuedDate ? new Date(certificate.issuedDate).toLocaleDateString("en-AU") : "Not issued"}
              </span>
              <select
                value={certificate.status}
                disabled={updatingId === certificate.id}
                onChange={(e) => updateStatus(certificate.id, e.target.value as CertificateStatus)}
                className="rounded-md px-2.5 py-1.5 text-xs outline-none disabled:opacity-60"
                style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
          ))}

          {certificates.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>
              No certificates yet — add the first compliance record.
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewCertificateModal
          jobs={jobs}
          electricians={electricians}
          onClose={() => setShowNew(false)}
          onDone={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function NewCertificateModal({
  jobs,
  electricians,
  onClose,
  onDone,
}: {
  jobs: JobOption[];
  electricians: ElectricianOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [certNumber, setCertNumber] = useState("");
  const [type, setType] = useState("Certificate of Electrical Safety");
  const [jobId, setJobId] = useState("");
  const [electricianId, setElectricianId] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [status, setStatus] = useState<CertificateStatus>("PENDING");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!jobId || !electricianId) {
      setError("Choose a job and issuing electrician.");
      return;
    }
    const electrician = electricians.find((item) => item.id === electricianId);
    if (!electrician?.licenseNumber) {
      setError("The issuing electrician must have a licence number recorded in Employees first.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certNumber,
        type,
        jobId,
        electricianId,
        issuedDate: issuedDate ? new Date(`${issuedDate}T12:00:00`).toISOString() : null,
        status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create certificate.");
      return;
    }
    onDone();
  }

  const fieldStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <div>
            <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New certificate</h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textFaint }}>Record a job compliance certificate.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <Field label="Certificate number">
            <input required value={certNumber} onChange={(e) => setCertNumber(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} placeholder="e.g. COES-2026-001" />
          </Field>

          <Field label="Certificate type">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option>Certificate of Electrical Safety</option>
              <option>Certificate of Compliance</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Job">
            <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option value="">Choose job</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} — {job.address}</option>)}
            </select>
          </Field>

          <Field label="Issuing electrician">
            <select required value={electricianId} onChange={(e) => setElectricianId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option value="">Choose electrician</option>
              {electricians.map((electrician) => (
                <option key={electrician.id} value={electrician.id}>{electrician.name}{electrician.licenseNumber ? ` — ${electrician.licenseNumber}` : " — no licence recorded"}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Issued date (optional)">
              <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as CertificateStatus)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                {STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
              </select>
            </Field>
          </div>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
            <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create certificate"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div>
      <div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div>
    </div>
  );
}
