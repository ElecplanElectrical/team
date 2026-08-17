"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type QuoteClientOption = { id: string; name: string };
export type QuoteJobOption = { id: string; title: string; clientId: string };

export default function NewQuoteModal({
  clients,
  jobs,
  onClose,
  onDone,
}: {
  clients: QuoteClientOption[];
  jobs: QuoteJobOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredJobs = useMemo(() => jobs.filter((j) => j.clientId === clientId), [jobs, clientId]);

  function changeClient(id: string) {
    setClientId(id);
    setJobId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!clientId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Choose a client and enter a valid amount.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, jobId: jobId || null, amount: numericAmount, status }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the quote.");
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
      <div className="w-full max-w-md rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New quote</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <Field label="Client">
            <select value={clientId} onChange={(e) => changeClient(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {clients.length === 0 && <option value="">No clients available</option>}
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Job (optional)">
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option value="">— none —</option>
              {filteredJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </Field>

          <Field label="Amount (AUD)">
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} autoFocus />
          </Field>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
            </select>
          </Field>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
            <button type="submit" disabled={saving || clients.length === 0} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create quote"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>{children}</label>;
}
