"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import NewInvoiceModal, { type InvoiceClientOption, type InvoiceJobOption } from "@/components/NewInvoiceModal";

const STATUSES = ["UNPAID", "PAID", "OVERDUE"] as const;
type InvoiceStatus = (typeof STATUSES)[number];

export type InvoiceRow = {
  id: string;
  ref: string;
  client: string;
  job: string | null;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  lineItemCount: number;
};

const UI = { panel: "var(--brand-panel, #07192b)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", primary: "var(--brand-primary, #168dff)", accent: "var(--brand-accent, #25c7ff)", green: "#18d3a0", red: "#ff5e72", orange: "#ffb24b" };
const STATUS_STYLE: Record<InvoiceStatus, { bg: string; fg: string; border: string }> = {
  UNPAID: { bg: "rgb(var(--brand-primary-rgb, 22 141 255) / .12)", fg: "var(--brand-accent, #62b6ff)", border: "rgb(var(--brand-primary-rgb, 22 141 255) / .30)" },
  PAID: { bg: "rgba(25,211,162,.11)", fg: "#4de2bb", border: "rgba(25,211,162,.28)" },
  OVERDUE: { bg: "rgba(255,94,114,.10)", fg: "#ff8292", border: "rgba(255,94,114,.25)" },
};

function money(value: number) { return value.toLocaleString("en-AU", { style: "currency", currency: "AUD" }); }
function dateLabel(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function statusLabel(status: InvoiceStatus) { return status.charAt(0) + status.slice(1).toLowerCase(); }
function StatusPill({ status }: { status: InvoiceStatus }) { const style = STATUS_STYLE[status]; return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{statusLabel(status)}</span>; }

export default function InvoicesView({ invoices, clients, jobs }: { invoices: InvoiceRow[]; clients: InvoiceClientOption[]; jobs: InvoiceJobOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");

  const outstanding = invoices.filter((invoice) => invoice.status !== "PAID").reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = invoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdue = invoices.filter((invoice) => invoice.status === "OVERDUE").reduce((sum, invoice) => sum + invoice.amount, 0);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (statusFilter !== "ALL" && invoice.status !== statusFilter) return false;
      return !needle || [invoice.ref, invoice.client, invoice.job ?? "", invoice.status].join(" ").toLowerCase().includes(needle);
    });
  }, [invoices, query, statusFilter]);

  async function updateStatus(id: string, status: InvoiceStatus) {
    setError(null);
    setUpdatingId(id);
    const response = await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setUpdatingId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not update invoice status.");
      return;
    }
    router.refresh();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;
  return <>
    <TopBar title="Invoices" subtitle="Create invoices and manage payment status" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white" style={{ background: UI.primary, boxShadow: "0 8px 24px rgb(var(--brand-primary-rgb, 22 141 255) / .25)" }}><Plus size={16} /> New invoice</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Outstanding" value={money(outstanding)} /><Metric label="Paid" value={money(paid)} /><Metric label="Overdue" value={money(overdue)} accent={overdue > 0 ? UI.red : undefined} /></div>
        {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
        <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: UI.borderSoft }}>
            <div className="relative min-w-0 flex-1 md:max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0"><span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: UI.faint }}><Filter size={13} /> Filters</span>{(["ALL", ...STATUSES] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold" style={{ background: statusFilter === status ? "rgb(var(--brand-primary-rgb, 22 141 255) / .16)" : "var(--brand-panel-deep, #041323)", color: statusFilter === status ? UI.accent : UI.mute, border: `1px solid ${statusFilter === status ? "rgb(var(--brand-accent-rgb, 37 199 255) / .30)" : UI.borderSoft}` }}>{status === "ALL" ? "All invoices" : statusLabel(status)}</button>)}</div>
          </div>
          <div className="hidden grid-cols-[150px_minmax(190px,1fr)_minmax(180px,1fr)_120px_130px_180px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] lg:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Invoice</span><span>Client</span><span>Job</span><span>Total</span><span>Due</span><span>Status</span></div>
          {filtered.map((invoice) => <div key={invoice.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 lg:grid-cols-[150px_minmax(190px,1fr)_minmax(180px,1fr)_120px_130px_180px] lg:items-center lg:gap-4" style={{ borderColor: UI.borderSoft }}>
            <div><span className="text-xs font-semibold" style={{ color: UI.text }}>{invoice.ref}</span><div className="mt-1 text-[11px]" style={{ color: UI.faint }}>{invoice.lineItemCount} line item{invoice.lineItemCount === 1 ? "" : "s"}</div></div>
            <span className="text-sm font-semibold" style={{ color: UI.text }}>{invoice.client}</span>
            <span className="text-xs" style={{ color: UI.mute }}>{invoice.job ?? "No linked job"}</span>
            <span className="text-sm font-semibold" style={{ color: UI.text }}>{money(invoice.amount)}</span>
            <span className="text-xs" style={{ color: invoice.status === "OVERDUE" ? UI.red : UI.mute }}>{dateLabel(invoice.dueDate)}</span>
            <div className="flex items-center gap-2"><StatusPill status={invoice.status} /><select aria-label={`Update ${invoice.ref} status`} value={invoice.status} disabled={updatingId === invoice.id} onChange={(event) => void updateStatus(invoice.id, event.target.value as InvoiceStatus)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div>
          </div>)}
          {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No invoices match the current filters.</div>}
          <div className="flex items-center justify-between px-4 py-3 text-[11px]" style={{ color: UI.faint }}><span>Showing {filtered.length} of {invoices.length}</span><span>{money(outstanding)} outstanding</span></div>
        </section>
      </div>
    </div>
    {showNew && <NewInvoiceModal clients={clients} jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><p className="text-[11px]" style={{ color: UI.faint }}>{label}</p><p className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</p></div>; }
