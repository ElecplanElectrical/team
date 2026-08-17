"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { COLORS, ON_ACCENT } from "@/lib/theme";
import TopBar from "@/components/TopBar";
import NewQuoteModal, { type QuoteClientOption, type QuoteJobOption } from "@/components/NewQuoteModal";

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED"] as const;
type QuoteStatus = (typeof STATUSES)[number];

export type QuoteRow = {
  id: string;
  ref: string;
  client: string;
  job: string | null;
  amount: number;
  status: QuoteStatus;
  createdAt: string;
};

function money(value: number): string {
  return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function statusLabel(status: QuoteStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function QuotesView({
  quotes,
  clients,
  jobs,
}: {
  quotes: QuoteRow[];
  clients: QuoteClientOption[];
  jobs: QuoteJobOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pipeline = quotes.filter((q) => q.status === "DRAFT" || q.status === "SENT").reduce((sum, q) => sum + q.amount, 0);
  const accepted = quotes.filter((q) => q.status === "ACCEPTED").reduce((sum, q) => sum + q.amount, 0);

  async function updateStatus(id: string, status: QuoteStatus) {
    setUpdatingId(id);
    setError(null);
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update quote.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <TopBar
        title="Quotes"
        subtitle={`${money(pipeline)} open pipeline · ${money(accepted)} accepted`}
        rightSlot={
          <button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}>
            <Plus size={15} /> New quote
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {error && <div className="rounded-md px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Open pipeline" value={money(pipeline)} />
          <Metric label="Accepted" value={money(accepted)} />
          <Metric label="Quotes" value={String(quotes.length)} />
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.card }}>
          <div className="hidden md:grid grid-cols-[100px_1fr_1fr_130px_150px] gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
            {['QUOTE','CLIENT','JOB','AMOUNT','STATUS'].map((h) => <span key={h} className="text-xs font-semibold" style={{ color: COLORS.textFaint }}>{h}</span>)}
          </div>
          {quotes.map((quote, i) => (
            <div key={quote.id} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_130px_150px] gap-2 md:gap-3 items-center px-4 md:px-5 py-4" style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}>
              <span className="text-xs font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textFaint }}>{quote.ref}</span>
              <span className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{quote.client}</span>
              <span className="text-xs truncate" style={{ color: COLORS.textMute }}>{quote.job ?? "No linked job"}</span>
              <span className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.text }}>{money(quote.amount)}</span>
              <select value={quote.status} disabled={updatingId === quote.id} onChange={(e) => updateStatus(quote.id, e.target.value as QuoteStatus)} className="rounded-md px-2.5 py-1.5 text-xs outline-none disabled:opacity-60" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          ))}
          {quotes.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No quotes yet — create the first one.</div>}
        </div>
      </div>

      {showNew && (
        <NewQuoteModal
          clients={clients}
          jobs={jobs}
          onClose={() => setShowNew(false)}
          onDone={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>;
}
