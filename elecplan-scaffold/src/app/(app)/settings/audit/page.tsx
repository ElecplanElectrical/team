import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { recentAuditRowsForBusiness } from "@/lib/audit";
import TopBar from "@/components/TopBar";

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", cyan: "var(--brand-accent, #25c7ff)" };

function detailSummary(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 4)
    .map(([key, val]) => `${key}: ${String(val)}`)
    .join(" · ");
}

export default async function AuditPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN" || !user.businessId) notFound();
  const rows = await recentAuditRowsForBusiness(user.businessId, 200);
  const actors = new Set(rows.map((row) => row.actorEmail ?? row.actorId ?? "System")).size;
  const actions = new Set(rows.map((row) => row.action)).size;

  return <>
    <TopBar title="Security audit" subtitle="Recent sensitive portal activity · admin only" />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: UI.cyan }}><ArrowLeft size={13} /> Back to Settings</Link>
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Recent events" value={String(rows.length)} /><Metric label="Actors" value={String(actors)} /><Metric label="Action types" value={String(actions)} /></div>
        <div className="rounded-xl px-4 py-3 text-xs leading-5" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.mute }}><span className="mr-2 inline-flex align-middle" style={{ color: UI.cyan }}><ShieldCheck size={15} /></span>Secret values and message bodies are intentionally excluded from audit metadata.</div>
        <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="hidden grid-cols-[170px_minmax(180px,1fr)_190px_180px_minmax(220px,1.3fr)] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ color: UI.faint, borderColor: UI.borderSoft }}><span>Time</span><span>Actor</span><span>Action</span><span>Entity</span><span>Details</span></div>
          {rows.map((row) => <div key={row.id} className="grid grid-cols-1 gap-2 border-b px-4 py-4 text-xs md:grid-cols-[170px_minmax(180px,1fr)_190px_180px_minmax(220px,1.3fr)] md:gap-4" style={{ borderColor: UI.borderSoft }}><span style={{ color: UI.mute }}>{row.createdAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}</span><span className="truncate" style={{ color: UI.text }}>{row.actorEmail ?? row.actorId ?? "System"}</span><span className="font-semibold" style={{ color: UI.cyan }}>{row.action}</span><span className="truncate" style={{ color: UI.mute }}>{row.entityType}{row.entityId ? ` · ${row.entityId}` : ""}</span><span className="truncate" style={{ color: UI.faint }}>{detailSummary(row.details) || "—"}</span></div>)}
          {rows.length === 0 && <div className="px-4 py-14 text-center text-sm" style={{ color: UI.faint }}>No audit events recorded yet.</div>}
          <div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing the most recent {rows.length} audit events</div>
        </section>
      </div>
    </div>
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</div></div>; }
