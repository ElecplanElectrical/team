"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Search, Plus } from "lucide-react";
import { COLORS, ON_ACCENT } from "@/lib/theme";
import TopBar from "@/components/TopBar";
import NewClientModal from "@/components/NewClientModal";

export type ClientRow = {
  id: string;
  name: string;
  contactName: string | null;
  jobs: number;
  billed: number;
  lastJob: string | null; // ISO date or null
};

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-AU");
}

function lastJobLabel(iso: string | null): string {
  if (!iso) return "—";
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export default function ClientsView({
  clients,
  totalBilled,
}: {
  clients: ClientRow[];
  totalBilled: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);

  const query = q.trim().toLowerCase();
  const filtered = query
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.contactName ?? "").toLowerCase().includes(query),
      )
    : clients;

  return (
    <>
      <TopBar
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"} · ${money(
          totalBilled,
        )} billed all-time`}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold"
            style={{ background: COLORS.accent, color: ON_ACCENT }}
          >
            <Plus size={15} /> New client
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          <Search size={15} style={{ color: COLORS.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients or contacts"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: COLORS.text }}
          />
        </div>

        <div
          className="rounded-lg overflow-hidden"
          style={{ border: `1px solid ${COLORS.border}`, background: COLORS.card }}
        >
          <div
            className="hidden sm:flex items-center px-5 py-2.5"
            style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
          >
            <span className="text-xs font-semibold flex-1" style={{ color: COLORS.textFaint }}>
              CLIENT
            </span>
            <span className="text-xs font-semibold w-32 shrink-0" style={{ color: COLORS.textFaint }}>
              CONTACT
            </span>
            <span className="text-xs font-semibold w-16 shrink-0 text-right" style={{ color: COLORS.textFaint }}>
              JOBS
            </span>
            <span className="text-xs font-semibold w-24 shrink-0 text-right" style={{ color: COLORS.textFaint }}>
              BILLED
            </span>
            <span className="text-xs font-semibold w-24 shrink-0 text-right" style={{ color: COLORS.textFaint }}>
              LAST JOB
            </span>
          </div>

          {filtered.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center flex-wrap gap-y-1 px-4 sm:px-5 py-3 sm:py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}
            >
              <span
                className="text-sm font-semibold flex-1 basis-full sm:basis-auto truncate"
                style={{ color: COLORS.text }}
              >
                {c.name}
              </span>
              <span
                className="hidden sm:inline-block text-xs w-32 shrink-0 truncate"
                style={{ color: COLORS.textMute }}
              >
                {c.contactName ?? "—"}
              </span>
              <span
                className="text-xs sm:text-sm sm:w-16 shrink-0 sm:text-right"
                style={{ color: COLORS.textMute }}
              >
                {c.jobs} job{c.jobs === 1 ? "" : "s"}
              </span>
              <span
                className="text-sm sm:w-24 shrink-0 text-right font-semibold ml-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.text }}
              >
                {money(c.billed)}
              </span>
              <span
                className="hidden sm:inline-block text-xs w-24 shrink-0 text-right"
                style={{ color: COLORS.textFaint }}
              >
                {lastJobLabel(c.lastJob)}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: COLORS.textFaint }}>
              {clients.length === 0
                ? "No clients yet — add your first one."
                : `No clients match "${q}"`}
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewClientModal
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
