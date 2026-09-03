"use client";

import { useMemo, useState } from "react";
import { ReceiptText, X } from "lucide-react";

export type BillClientOption = { id: string; name: string };
export type BillJobOption = { id: string; title: string; clientId: string };

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72" };

export default function NewBillModal({ clients, jobs, onClose, onDone }: { clients: BillClientOption[]; jobs: BillJobOption[]; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<"client" | "supplier">("client");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [supplier, setSupplier] = useState("");
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("UNPAID");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientJobs = useMemo(() => kind === "client" ? jobs.filter((job) => job.clientId === clientId) : jobs, [kind, jobs, clientId]);
  function switchKind(next: "client" | "supplier") { setKind(next); setJobId(""); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Enter a valid amount greater than zero.");
    if (!dueDate) return setError("Due date is required.");
    if (kind === "client" && !clientId) return setError("Select a client.");
    if (kind === "supplier" && !supplier.trim()) return setError("Supplier name is required.");

    setSaving(true);
    const due = new Date(`${dueDate}T12:00:00`);
    const res = await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: kind === "client" ? clientId : null, supplier: kind === "supplier" ? supplier.trim() : null, jobId: jobId || null, amount: numericAmount, dueDate: due.toISOString(), status }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not create the bill."); return; }
    onDone();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="w-full max-w-2xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><ReceiptText size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>New bill / invoice</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Record a client receivable or supplier payable.</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.borderSoft}` }}>
          <button type="button" onClick={() => switchKind("client")} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: kind === "client" ? UI.blue : "transparent", color: kind === "client" ? "white" : UI.mute }}>Client invoice</button>
          <button type="button" onClick={() => switchKind("supplier")} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: kind === "supplier" ? UI.blue : "transparent", color: kind === "supplier" ? "white" : UI.mute }}>Supplier bill</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {kind === "client" ? <Field label="Client"><select value={clientId} onChange={(e) => { setClientId(e.target.value); setJobId(""); }} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field> : <Field label="Supplier"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>}
          <Field label="Linked job (optional)"><select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">No linked job</option>{clientJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field>
          <Field label="Amount (AUD)"><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option></select></Field>
        </div>

        {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || (kind === "client" && clients.length === 0)} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : kind === "client" ? "Create invoice" : "Create bill"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
