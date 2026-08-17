"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import NewBillModal, { type BillClientOption, type BillJobOption } from "@/components/NewBillModal";

export type BillRow = {
  id: string;
  ref: string;
  client: string | null;
  supplier: string | null;
  job: string | null;
  amount: number;
  dueDate: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["UNPAID", "PAID", "OVERDUE"] as const;
type BillStatus = (typeof STATUSES)[number];

const UI = {
  panel: "#07192b",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
  green: "#18d3a0",
  red: "#ff5e72",
  orange: "#ff9f1c",
};

const STATUS_STYLE: Record<BillStatus, { bg: string; fg: string; border: string }> = {
  UNPAID: { bg: "rgba(22,141,255,.12)", fg: "#62b6ff", border: "rgba(22,141,255,.30)" },
  PAID: { bg: "rgba(25,211,162,.11)", fg: "#4de2bb", border: "rgba(25,211,162,.28)" },
  OVERDUE: { bg: "rgba(255,94,114,.10)", fg: "#ff8292", border: "rgba(255,94,114,.25)" },
};

function money(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function StatusPill({ status }: { status: BillStatus }) {
  const style = STATUS_STYLE[status];
  return <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: style.bg, color: style.fg, border: `1px solid ${style.border}` }}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

export default function BillsView({ bills, clients, jobs }: { bills: BillRow[]; clients: BillClientOption[]; jobs: BillJobOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BillStatus>("ALL");

  const receivables = bills.filter((b) => b.client && b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);
  const payables = bills.filter((b) => b.supplier && b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);
  const overdue = bills.filter((b) => b.status === "OVERDUE").reduce((sum, b) => sum + b.amount, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bills.filter((bill) => {
      if (statusFilter !== "ALL" && bill.status !== statusFilter) return false;
      if (!needle) return true;
      return [bill.ref, bill.client ?? "", bill.supplier ?? "", bill.job ?? "", bill.status].join(" ").toLowerCase().includes(needle);
    });
  }, [bills, query, statusFilter]);

  async function updateStatus(id: string, status: BillStatus) {
    setError(null);
    setUpdatingId(id);
    const res = await fetch(`/api/bills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update status.");
      return;
    }
    router.refresh();
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return (
    <>
      <TopBar title="Bills & invoices" subtitle="Manage receivables and supplier bills" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}><Plus size={16} /> New bill</button>} />

      <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}>
        <div className="mx-auto w-full max-w-[1700px] space-y-3">
          <div className="grid gap-3 sm:grid-cols-3"><Metric label="Receivables" value={money(receivables)} /><Metric label="Payables" value={money(payables)} /><Metric label="Overdue" value={money(overdue)} accent={overdue > 0 ? UI.red : undefined} /></div>
          {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}

          <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: UI.borderSoft }}>
              <div className="relative min-w-0 flex-1 md:max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bills and invoices…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0"><span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: UI.faint }}><Filter size={13} /> Filters</span>{(["ALL", ...STATUSES] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold" style={{ background: statusFilter === status ? "rgba(22,141,255,.16)" : "#041323", color: statusFilter === status ? UI.cyan : UI.mute, border: `1px solid ${statusFilter === status ? "rgba(37,199,255,.30)" : UI.borderSoft}` }}>{status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}</button>)}</div>
            </div>

            <div className="hidden grid-cols-[100px_minmax(180px,1.2fr)_minmax(180px,1fr)_120px_130px_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Ref</span><span>Counterparty</span><span>Job</span><span>Amount</span><span>Due</span><span>Status</span></div>

            {filtered.map((bill) => {
              const status = (STATUSES.includes(bill.status as BillStatus) ? bill.status : "UNPAID") as BillStatus;
              return <div key={bill.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[100px_minmax(180px,1.2fr)_minmax(180px,1fr)_120px_130px_150px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><span className="text-xs font-semibold" style={{ color: UI.text }}>{bill.ref}</span><div className="min-w-0"><div className="truncate text-sm font-semibold" style={{ color: UI.text }}>{bill.client ?? bill.supplier ?? "—"}</div><div className="mt-1 text-[11px]" style={{ color: UI.faint }}>{bill.client ? "Client invoice" : "Supplier bill"}</div></div><span className="text-xs" style={{ color: UI.mute }}>{bill.job ?? "—"}</span><span className="text-sm font-semibold" style={{ color: UI.text }}>{money(bill.amount)}</span><span className="text-xs" style={{ color: status === "OVERDUE" ? UI.red : UI.mute }}>{dateLabel(bill.dueDate)}</span><div className="flex items-center gap-2"><StatusPill status={status} /><select aria-label={`Update ${bill.ref} status`} value={status} disabled={updatingId === bill.id} onChange={(e) => void updateStatus(bill.id, e.target.value as BillStatus)} className="min-w-0 rounded-lg px-2 py-1.5 text-[11px] outline-none disabled:opacity-60" style={field}>{STATUSES.map((item) => <option key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</option>)}</select></div></div>;
            })}

            {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No bills or invoices match the current filters.</div>}
            <div className="flex items-center justify-between px-4 py-3 text-[11px]" style={{ color: UI.faint }}><span>Showing {filtered.length} of {bills.length}</span><span>{money(overdue)} overdue</span></div>
          </section>
        </div>
      </div>

      {showNew && <NewBillModal clients={clients} jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
    </>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>;
}
