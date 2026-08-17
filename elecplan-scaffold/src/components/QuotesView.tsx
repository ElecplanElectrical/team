"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Filter, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import NewQuoteModal, { type QuoteClientOption, type QuoteJobOption } from "@/components/NewQuoteModal";

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED"] as const;
type QuoteStatus = (typeof STATUSES)[number];

export type QuoteRow = {
  id: string;
  ref: string;
  client: string;
  job: string | null;
  subtotal: number | null;
  gstAmount: number | null;
  amount: number;
  status: QuoteStatus;
  lineItemCount: number;
  invoiceRef: string | null;
  createdAt: string;
};

const UI = {
  panel: "#07192b",
  panelAlt: "#09213a",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
  green: "#18d3a0",
  purple: "#8a5cf6",
  red: "#ff5e72",
  orange: "#ff9f1c",
};

const STATUS_STYLE: Record<QuoteStatus, { bg: string; fg: string; border: string }> = {
  DRAFT: { bg: "rgba(147,169,194,.10)", fg: "#a9bbcf", border: "rgba(147,169,194,.22)" },
  SENT: { bg: "rgba(22,141,255,.12)", fg: "#62b6ff", border: "rgba(22,141,255,.30)" },
  ACCEPTED: { bg: "rgba(25,211,162,.11)", fg: "#4de2bb", border: "rgba(25,211,162,.28)" },
  DECLINED: { bg: "rgba(255,94,114,.10)", fg: "#ff8292", border: "rgba(255,94,114,.25)" },
};

function money(value: number) {
  return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });
}

function statusLabel(status: QuoteStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function StatusPill({ status }: { status: QuoteStatus }) {
  const style = STATUS_STYLE[status];
  return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{statusLabel(status)}</span>;
}

export default function QuotesView({ quotes, clients, jobs }: { quotes: QuoteRow[]; clients: QuoteClientOption[]; jobs: QuoteJobOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | QuoteStatus>("ALL");

  const pipeline = quotes.filter((q) => q.status === "DRAFT" || q.status === "SENT").reduce((sum, q) => sum + q.amount, 0);
  const accepted = quotes.filter((q) => q.status === "ACCEPTED").reduce((sum, q) => sum + q.amount, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "ALL" && quote.status !== statusFilter) return false;
      if (!needle) return true;
      return [quote.ref, quote.client, quote.job ?? "", quote.invoiceRef ?? ""].join(" ").toLowerCase().includes(needle);
    });
  }, [quotes, query, statusFilter]);

  async function updateStatus(id: string, status: QuoteStatus) {
    setUpdatingId(id);
    setError(null);
    const res = await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update quote.");
      return;
    }
    router.refresh();
  }

  async function convert(id: string) {
    setConvertingId(id);
    setError(null);
    const res = await fetch(`/api/quotes/${id}/convert`, { method: "POST" });
    setConvertingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create invoice.");
      return;
    }
    router.refresh();
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return (
    <>
      <TopBar title="Quotes" subtitle="Create and manage quotes" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}><Plus size={16} /> New quote</button>} />
      <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}>
        <div className="mx-auto w-full max-w-[1700px] space-y-3">
          <div className="grid gap-3 sm:grid-cols-3"><Metric label="Open pipeline" value={money(pipeline)} /><Metric label="Accepted" value={money(accepted)} /><Metric label="Quotes" value={String(quotes.length)} /></div>
          {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

          <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: UI.borderSoft }}>
              <div className="relative min-w-0 flex-1 md:max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0"><span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: UI.faint }}><Filter size={13} /> Filters</span>{(["ALL", ...STATUSES] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold" style={{ background: statusFilter === status ? "rgba(22,141,255,.16)" : "#041323", color: statusFilter === status ? UI.cyan : UI.mute, border: `1px solid ${statusFilter === status ? "rgba(37,199,255,.30)" : UI.borderSoft}` }}>{status === "ALL" ? "All quotes" : statusLabel(status)}</button>)}</div>
            </div>

            <div className="hidden grid-cols-[150px_minmax(180px,1fr)_minmax(180px,1fr)_120px_130px_190px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] lg:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Quote</span><span>Client</span><span>Job</span><span>Total</span><span>Status</span><span>Invoice</span></div>

            {filtered.map((quote) => <div key={quote.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 lg:grid-cols-[150px_minmax(180px,1fr)_minmax(180px,1fr)_120px_130px_190px] lg:items-center lg:gap-4" style={{ borderColor: UI.borderSoft }}>
              <div><span className="text-xs font-semibold" style={{ color: UI.text }}>{quote.ref}</span><div className="mt-1 text-[11px]" style={{ color: UI.faint }}>{quote.lineItemCount > 0 ? `${quote.lineItemCount} line item${quote.lineItemCount === 1 ? "" : "s"}` : "Legacy amount"}</div></div>
              <span className="text-sm font-semibold" style={{ color: UI.text }}>{quote.client}</span>
              <span className="text-xs" style={{ color: UI.mute }}>{quote.job ?? "No linked job"}</span>
              <div><span className="text-sm font-semibold" style={{ color: UI.text }}>{money(quote.amount)}</span>{quote.gstAmount != null && <div className="text-[11px]" style={{ color: UI.faint }}>{money(quote.gstAmount)} GST</div>}</div>
              <div className="flex items-center gap-2"><StatusPill status={quote.status} /><select aria-label={`Update ${quote.ref} status`} value={quote.status} disabled={updatingId === quote.id || Boolean(quote.invoiceRef)} onChange={(e) => void updateStatus(quote.id, e.target.value as QuoteStatus)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div>
              {quote.invoiceRef ? <span className="text-xs font-semibold" style={{ color: UI.cyan }}>{quote.invoiceRef}</span> : quote.status === "ACCEPTED" ? <button type="button" disabled={convertingId === quote.id} onClick={() => void convert(quote.id)} className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60" style={{ background: "rgba(22,141,255,.13)", color: UI.cyan, border: "1px solid rgba(37,199,255,.28)" }}><FileDown size={14} />{convertingId === quote.id ? "Creating…" : "Create invoice"}</button> : <span className="text-xs" style={{ color: UI.faint }}>Accept quote first</span>}
            </div>)}

            {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No quotes match the current filters.</div>}
            <div className="flex items-center justify-between px-4 py-3 text-[11px]" style={{ color: UI.faint }}><span>Showing {filtered.length} of {quotes.length} quotes</span><span>{money(pipeline)} open pipeline</span></div>
          </section>
        </div>
      </div>
      {showNew && <NewQuoteModal clients={clients} jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</div></div>;
}
