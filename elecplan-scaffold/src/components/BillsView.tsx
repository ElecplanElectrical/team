"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import NewBillModal, { type BillClientOption, type BillJobOption } from "@/components/NewBillModal";
import { COLORS, ON_ACCENT } from "@/lib/theme";

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

function money(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function BillsView({
  bills,
  clients,
  jobs,
}: {
  bills: BillRow[];
  clients: BillClientOption[];
  jobs: BillJobOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const receivables = bills.filter((b) => b.client && b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);
  const payables = bills.filter((b) => b.supplier && b.status !== "PAID").reduce((sum, b) => sum + b.amount, 0);
  const overdue = bills.filter((b) => b.status === "OVERDUE").reduce((sum, b) => sum + b.amount, 0);

  async function updateStatus(id: string, status: (typeof STATUSES)[number]) {
    setError(null);
    setUpdatingId(id);
    const res = await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update status.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <TopBar
        title="Bills & invoices"
        subtitle={`${money(receivables)} receivable · ${money(payables)} payable · ${money(overdue)} overdue`}
        rightSlot={
          <button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}>
            <Plus size={15} /> New bill
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {error && <div className="rounded-md px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}

        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div className="hidden md:grid grid-cols-[90px_1.4fr_1.2fr_120px_120px_150px] gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
            {['REF','COUNTERPARTY','JOB','AMOUNT','DUE','STATUS'].map((h) => <span key={h} className="text-xs font-semibold" style={{ color: COLORS.textFaint }}>{h}</span>)}
          </div>

          {bills.map((bill, i) => (
            <div key={bill.id} className="grid grid-cols-1 md:grid-cols-[90px_1.4fr_1.2fr_120px_120px_150px] gap-2 md:gap-3 px-5 py-4 items-center" style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}>
              <span className="text-xs font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textFaint }}>{bill.ref}</span>
              <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{bill.client ?? bill.supplier ?? "—"}</div><div className="text-[11px]" style={{ color: COLORS.textFaint }}>{bill.client ? "Client invoice" : "Supplier bill"}</div></div>
              <span className="text-xs truncate" style={{ color: COLORS.textMute }}>{bill.job ?? "—"}</span>
              <span className="text-sm font-semibold" style={{ color: COLORS.text }}>{money(bill.amount)}</span>
              <span className="text-xs" style={{ color: COLORS.textMute }}>{dateLabel(bill.dueDate)}</span>
              <select value={bill.status} disabled={updatingId === bill.id} onChange={(e) => updateStatus(bill.id, e.target.value as (typeof STATUSES)[number])} className="rounded-md px-2 py-1.5 text-xs outline-none disabled:opacity-60" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          ))}

          {bills.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No bills or invoices yet.</div>}
        </div>
      </div>

      {showNew && <NewBillModal clients={clients} jobs={jobs} onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
    </>
  );
}
