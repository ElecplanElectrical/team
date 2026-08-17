"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FileText, Plus, Trash2, X } from "lucide-react";

export type QuoteClientOption = { id: string; name: string };
export type QuoteJobOption = { id: string; title: string; clientId: string };
type DraftLine = { description: string; quantity: string; unitPrice: string; gstRate: string };

const blankLine = (): DraftLine => ({ description: "", quantity: "1", unitPrice: "", gstRate: "0.1" });
const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", red: "#ff5e72" };

export default function NewQuoteModal({ clients, jobs, onClose, onDone }: { clients: QuoteClientOption[]; jobs: QuoteJobOption[]; onClose: () => void; onDone: () => void }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [jobId, setJobId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredJobs = useMemo(() => jobs.filter((job) => job.clientId === clientId), [jobs, clientId]);
  const totals = useMemo(() => lines.reduce((acc, line) => {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const rate = Number(line.gstRate) || 0;
    const net = quantity * unitPrice;
    return { subtotal: acc.subtotal + net, gst: acc.gst + net * rate };
  }, { subtotal: 0, gst: 0 }), [lines]);

  function changeClient(id: string) { setClientId(id); setJobId(""); }
  function updateLine(index: number, key: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lineItems = lines.map((line) => ({ description: line.description.trim(), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), gstRate: Number(line.gstRate) }));
    if (!clientId || lineItems.some((line) => !line.description || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) return setError("Choose a client and complete each line item.");

    setSaving(true);
    try {
      const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, jobId: jobId || null, lineItems, status }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not create the quote.");
        return;
      }
      onDone();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  const money = (value: number) => value.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-3xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-quote-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><FileText size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="new-quote-title" className="text-base font-semibold" style={{ color: UI.text }}>New quote</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Build the quote line-by-line with totals calculated before you save.</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[84vh] overflow-auto p-5" aria-busy={saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client"><select value={clientId} onChange={(e) => changeClient(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
          <Field label="Job (optional)"><select value={jobId} onChange={(e) => setJobId(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="">No linked job</option>{filteredJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>Line items</span><button type="button" onClick={() => setLines((current) => [...current, blankLine()])} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "rgba(22,141,255,.10)", color: UI.cyan, border: "1px solid rgba(37,199,255,.22)" }}><Plus size={13} /> Add line</button></div>
          <div className="space-y-2">
            {lines.map((line, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-xl p-3 sm:grid-cols-[minmax(180px,1fr)_90px_130px_110px_38px] sm:items-end" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
              <Field label="Description"><input value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} className="h-10 w-full rounded-lg px-2.5 text-sm outline-none" style={field} /></Field>
              <Field label="Qty"><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} className="h-10 w-full rounded-lg px-2.5 text-sm outline-none" style={field} /></Field>
              <Field label="Unit price"><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, "unitPrice", e.target.value)} className="h-10 w-full rounded-lg px-2.5 text-sm outline-none" style={field} /></Field>
              <Field label="GST"><select value={line.gstRate} onChange={(e) => updateLine(index, "gstRate", e.target.value)} className="h-10 w-full rounded-lg px-2.5 text-sm outline-none" style={field}><option value="0.1">10%</option><option value="0">GST free</option></select></Field>
              <button type="button" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="flex h-10 items-center justify-center rounded-lg disabled:opacity-30" style={{ color: UI.red, border: `1px solid ${UI.borderSoft}` }}><Trash2 size={15} /></button>
            </div>)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: "#041323", border: `1px solid ${UI.borderSoft}` }}><Total label="Subtotal" value={money(totals.subtotal)} /><Total label="GST" value={money(totals.gst)} /><Total label="Total" value={money(totals.subtotal + totals.gst)} strong /></div>
        <div className="mt-4 max-w-xs"><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="DECLINED">Declined</option></select></Field></div>
        {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create quote"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
function Total({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div><p className="text-[10px]" style={{ color: UI.faint }}>{label}</p><p className={strong ? "mt-1 text-base font-semibold" : "mt-1 text-sm font-semibold"} style={{ color: strong ? UI.cyan : UI.text }}>{value}</p></div>; }
