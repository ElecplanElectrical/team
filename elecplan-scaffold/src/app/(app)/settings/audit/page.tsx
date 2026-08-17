import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { recentAuditRows } from "@/lib/audit";
import { COLORS } from "@/lib/theme";

function detailSummary(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const pairs = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 4)
    .map(([key, val]) => `${key}: ${String(val)}`);
  return pairs.join(" · ");
}

export default async function AuditPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();

  const rows = await recentAuditRows(200);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <div>
          <Link href="/settings" className="text-xs font-semibold" style={{ color: COLORS.accent }}>← Settings & security</Link>
          <h1 className="text-2xl font-semibold mt-2" style={{ color: COLORS.text }}>Audit log</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textMute }}>
            Recent security-sensitive actions. Secret values and message bodies are intentionally excluded.
          </p>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div className="hidden md:grid grid-cols-[170px_180px_170px_150px_1fr] gap-3 px-4 py-2.5 text-xs font-semibold" style={{ color: COLORS.textFaint, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
            <span>TIME</span><span>ACTOR</span><span>ACTION</span><span>ENTITY</span><span>DETAILS</span>
          </div>
          {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-[170px_180px_170px_150px_1fr] gap-1 md:gap-3 px-4 py-3 text-xs" style={{ borderTop: index === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}>
              <span style={{ color: COLORS.textMute }}>{row.createdAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}</span>
              <span className="truncate" style={{ color: COLORS.text }}>{row.actorEmail ?? row.actorId ?? "System"}</span>
              <span className="font-semibold" style={{ color: COLORS.text }}>{row.action}</span>
              <span className="truncate" style={{ color: COLORS.textMute }}>{row.entityType}{row.entityId ? ` · ${row.entityId}` : ""}</span>
              <span className="truncate" style={{ color: COLORS.textFaint }}>{detailSummary(row.details) || "—"}</span>
            </div>
          ))}
          {rows.length === 0 && <div className="px-4 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No audit events recorded yet.</div>}
        </div>
      </div>
    </div>
  );
}
