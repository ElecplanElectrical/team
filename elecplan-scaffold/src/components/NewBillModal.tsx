"use client";

import { useMemo, useState } from "react";
import { FileScan, Loader2, ReceiptText, Upload, X } from "lucide-react";

export type BillClientOption = { id: string; name: string };
export type BillJobOption = { id: string; title: string; clientId: string };
type UploadTicket = { uploadUrl: string; uploadHeaders: Record<string, string>; commitToken: string };
type ExtractedInvoice = { supplier: string | null; invoiceNumber: string | null; invoiceDate: string | null; dueDate: string | null; subtotal: number | null; gstAmount: number | null; total: number | null; confidence: number };

const UI = { panel: "#0a2038", panelAlt: "#103152", border: "rgba(125,211,252,.28)", borderSoft: "rgba(125,211,252,.14)", text: "#f5f9ff", mute: "#a8c3dd", faint: "#7392af", blue: "#38bdf8", cyan: "#7dd3fc", red: "#ff7185" };

export default function NewBillModal({ clients, jobs, storageReady, aiReady, onClose, onDone }: { clients: BillClientOption[]; jobs: BillJobOption[]; storageReady: boolean; aiReady: boolean; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<"client" | "supplier">("client");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [supplier, setSupplier] = useState("");
  const [jobId, setJobId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [gstAmount, setGstAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("UNPAID");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const clientJobs = useMemo(() => kind === "client" ? jobs.filter((job) => job.clientId === clientId) : jobs, [kind, jobs, clientId]);

  function switchKind(next: "client" | "supplier") {
    setKind(next);
    setJobId("");
  }

  async function readInvoice(next: File) {
    setFile(next);
    setError(null);
    setExtractNote(null);
    if (!aiReady) {
      setExtractNote("The document will be attached, but automatic reading needs the Elecplan AI key configured.");
      return;
    }
    setExtracting(true);
    const form = new FormData();
    form.append("file", next);
    const response = await fetch("/api/bills/extract", { method: "POST", body: form });
    const body = await response.json().catch(() => null) as ExtractedInvoice | { error?: string } | null;
    setExtracting(false);
    if (!response.ok || !body || !("confidence" in body)) {
      setError(body && "error" in body ? body.error || "Could not read invoice" : "Could not read invoice");
      return;
    }
    setKind("supplier");
    if (body.supplier) setSupplier(body.supplier);
    if (body.invoiceNumber) setInvoiceNumber(body.invoiceNumber);
    if (typeof body.subtotal === "number") setSubtotal(body.subtotal.toFixed(2));
    if (typeof body.gstAmount === "number") setGstAmount(body.gstAmount.toFixed(2));
    if (typeof body.total === "number") setAmount(body.total.toFixed(2));
    if (body.dueDate) setDueDate(body.dueDate);
    setExtractNote(`Invoice read at ${Math.round(body.confidence * 100)}% confidence. Check the filled numbers before saving.`);
  }

  async function uploadDocument() {
    if (!file) return null;
    if (!storageReady) throw new Error("Private invoice storage is not configured yet.");
    const ticketResponse = await fetch("/api/storage/upload-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "invoice-documents", fileName: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size }) });
    const ticketBody = await ticketResponse.json().catch(() => null);
    if (!ticketResponse.ok) throw new Error(ticketBody?.error || "Could not prepare invoice upload");
    const ticket = ticketBody as UploadTicket;
    const uploadResponse = await fetch(ticket.uploadUrl, { method: "PUT", headers: ticket.uploadHeaders, body: file });
    if (!uploadResponse.ok) throw new Error("Invoice document upload failed");
    return ticket.commitToken;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Enter a valid amount greater than zero.");
    if (!dueDate) return setError("Due date is required.");
    if (kind === "client" && !clientId) return setError("Select a client.");
    if (kind === "supplier" && !supplier.trim()) return setError("Supplier name is required.");
    setSaving(true);
    try {
      const documentCommitToken = await uploadDocument();
      const due = new Date(`${dueDate}T12:00:00`);
      const response = await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: kind === "client" ? clientId : null, supplier: kind === "supplier" ? supplier.trim() : null, jobId: jobId || null, invoiceNumber: invoiceNumber.trim() || null, subtotal: subtotal ? Number(subtotal) : null, gstAmount: gstAmount ? Number(gstAmount) : null, amount: numericAmount, dueDate: due.toISOString(), status, documentCommitToken }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not create the bill.");
      onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create the bill.");
    } finally {
      setSaving(false);
    }
  }

  const field = { background: "#061525", border: `1px solid ${UI.border}`, color: UI.text } as const;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="w-full max-w-3xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(56,189,248,.13)", color: UI.cyan }}><ReceiptText size={18} /></span><div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>New bill / invoice</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Upload the supplier document to fill the numbers, or enter them manually.</p></div><button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button></header>
      <form onSubmit={submit} className="max-h-[84vh] overflow-auto p-5">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4" style={{ background: "rgba(56,189,248,.06)", borderColor: "rgba(125,211,252,.32)" }}><span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(56,189,248,.14)", color: UI.cyan }}>{extracting ? <Loader2 size={20} className="animate-spin" /> : file ? <FileScan size={20} /> : <Upload size={20} />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm" style={{ color: UI.text }}>{file?.name || "Upload invoice photo or PDF"}</strong><span className="mt-1 block text-xs" style={{ color: UI.mute }}>{extracting ? "Reading supplier, dates, GST and total…" : "PDF, JPG, PNG or WebP · up to 15 MB"}</span></span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const next = event.target.files?.[0]; if (next) void readInvoice(next); }} /></label>
        {extractNote && <p className="mt-2 text-xs" style={{ color: UI.cyan }}>{extractNote}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "#061525", border: `1px solid ${UI.borderSoft}` }}><button type="button" onClick={() => switchKind("client")} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: kind === "client" ? UI.blue : "transparent", color: kind === "client" ? "#06213a" : UI.mute }}>Client invoice</button><button type="button" onClick={() => switchKind("supplier")} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={{ background: kind === "supplier" ? UI.blue : "transparent", color: kind === "supplier" ? "#06213a" : UI.mute }}>Supplier bill</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {kind === "client" ? <Field label="Client"><select value={clientId} onChange={(event) => { setClientId(event.target.value); setJobId(""); }} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field> : <Field label="Supplier"><input value={supplier} onChange={(event) => setSupplier(event.target.value)} placeholder="Supplier name" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>}
          <Field label="Invoice number"><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="From document" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Linked job (optional)"><select value={jobId} onChange={(event) => setJobId(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">No linked job</option>{clientJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field>
          <Field label="Subtotal (AUD)"><input type="number" min="0" step="0.01" value={subtotal} onChange={(event) => setSubtotal(event.target.value)} placeholder="0.00" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="GST (AUD)"><input type="number" min="0" step="0.01" value={gstAmount} onChange={(event) => setGstAmount(event.target.value)} placeholder="0.00" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Total (AUD)"><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Due date"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option></select></Field>
        </div>
        {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || extracting || (kind === "client" && clients.length === 0)} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "#06213a" }}>{saving ? "Saving…" : kind === "client" ? "Create invoice" : "Create bill"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>;
}
