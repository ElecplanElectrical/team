"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type QuoteClientOption = { id: string; name: string };
export type QuoteJobOption = { id: string; title: string; clientId: string };
type DraftLine = { description: string; quantity: string; unitPrice: string; gstRate: string };

const blankLine = (): DraftLine => ({ description: "", quantity: "1", unitPrice: "", gstRate: "0.1" });

export default function NewQuoteModal({ clients, jobs, onClose, onDone }: { clients: QuoteClientOption[]; jobs: QuoteJobOption[]; onClose: () => void; onDone: () => void }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [jobId, setJobId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredJobs = useMemo(() => jobs.filter((j) => j.clientId === clientId), [jobs, clientId]);
  const totals = useMemo(() => lines.reduce((acc, line) => {
    const q = Number(line.quantity) || 0;
    const p = Number(line.unitPrice) || 0;
    const rate = Number(line.gstRate) || 0;
    const net = q * p;
    return { subtotal: acc.subtotal + net, gst: acc.gst + net * rate };
  }, { subtotal: 0, gst: 0 }), [lines]);

  function changeClient(id: string) { setClientId(id); setJobId(""); }
  function updateLine(index: number, key: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lineItems = lines.map((line) => ({ description: line.description.trim(), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), gstRate: Number(line.gstRate) }));
    if (!clientId || lineItems.some((line) => !line.description || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) {
      setError("Choose a client and complete each line item.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, jobId: jobId || null, lineItems, status }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the quote.");
      return;
    }
    onDone();
  }

  const fieldStyle: React.CSSProperties = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text };
  const money = (value: number) => value.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New quote</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Client"><select value={clientId} onChange={(e) => changeClient(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={fieldStyle}>{clients.length === 0 && <option value="">No clients available</option>}{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Job (optional)"><select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={fieldStyle}><option value="">— none —</option>{filteredJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></Field>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold" style={{ color: COLORS.textMute }}>LINE ITEMS</span><button type="button" onClick={() => setLines((v) => [...v, blankLine()])} className="text-xs flex items-center gap-1" style={{ color: COLORS.accent }}><Plus size={13}/> Add line</button></div>
            {lines.map((line, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_90px_120px_100px_34px] gap-2 items-end rounded-md p-3" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.borderSoft}` }}>
              <Field label="Description"><input value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} className="w-full rounded-md px-2.5 py-2 text-sm" style={fieldStyle} /></Field>
              <Field label="Qty"><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} className="w-full rounded-md px-2.5 py-2 text-sm" style={fieldStyle} /></Field>
              <Field label="Unit price"><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, "unitPrice", e.target.value)} className="w-full rounded-md px-2.5 py-2 text-sm" style={fieldStyle} /></Field>
              <Field label="GST"><select value={line.gstRate} onChange={(e) => updateLine(index, "gstRate", e.target.value)} className="w-full rounded-md px-2.5 py-2 text-sm" style={fieldStyle}><option value="0.1">10%</option><option value="0">GST free</option></select></Field>
              <button type="button" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((v) => v.filter((_, i) => i !== index))} className="h-9 rounded-md disabled:opacity-30 flex items-center justify-center" style={{ color: COLORS.coral }}><Trash2 size={15}/></button>
            </div>)}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm rounded-md p-3" style={{ background: COLORS.cardAlt }}><div><div className="text-xs" style={{ color: COLORS.textFaint }}>Subtotal</div><strong>{money(totals.subtotal)}</strong></div><div><div className="text-xs" style={{ color: COLORS.textFaint }}>GST</div><strong>{money(totals.gst)}</strong></div><div><div className="text-xs" style={{ color: COLORS.textFaint }}>Total</div><strong>{money(totals.subtotal + totals.gst)}</strong></div></div>

          <Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm" style={fieldStyle}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="DECLINED">Declined</option></select></Field>
          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create quote"}</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1"><span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>{children}</label>; }
