"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type BillClientOption = { id: string; name: string };
export type BillJobOption = { id: string; title: string; clientId: string };

export default function NewBillModal({
  clients,
  jobs,
  onClose,
  onDone,
}: {
  clients: BillClientOption[];
  jobs: BillJobOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"client" | "supplier">("client");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [supplier, setSupplier] = useState("");
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("UNPAID");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientJobs = useMemo(
    () => (kind === "client" ? jobs.filter((job) => job.clientId === clientId) : jobs),
    [kind, jobs, clientId],
  );

  function switchKind(next: "client" | "supplier") {
    setKind(next);
    setJobId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    if (kind === "client" && !clientId) {
      setError("Select a client.");
      return;
    }
    if (kind === "supplier" && !supplier.trim()) {
      setError("Supplier name is required.");
      return;
    }

    setSaving(true);
    const due = new Date(`${dueDate}T12:00:00`);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: kind === "client" ? clientId : null,
        supplier: kind === "supplier" ? supplier.trim() : null,
        jobId: jobId || null,
        amount: numericAmount,
        dueDate: due.toISOString(),
        status,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the bill.");
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
          <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New bill / invoice</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => switchKind("client")} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: kind === "client" ? COLORS.accent : COLORS.cardAlt, color: kind === "client" ? ON_ACCENT : COLORS.textMute }}>Client invoice</button>
            <button type="button" onClick={() => switchKind("supplier")} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: kind === "supplier" ? COLORS.accent : COLORS.cardAlt, color: kind === "supplier" ? ON_ACCENT : COLORS.textMute }}>Supplier bill</button>
          </div>

          {kind === "client" ? (
            <Field label="Client">
              <select value={clientId} onChange={(e) => { setClientId(e.target.value); setJobId(""); }} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Supplier">
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
          )}

          <Field label="Linked job (optional)">
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
              <option value="">— none —</option>
              {clientJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Amount (AUD)">
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle}>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </Field>
          </div>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button>
            <button type="submit" disabled={saving || (kind === "client" && clients.length === 0)} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>{children}</label>;
}
