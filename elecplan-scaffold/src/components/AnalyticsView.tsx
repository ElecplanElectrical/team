import Link from "next/link";
import TopBar from "@/components/TopBar";
import { COLORS } from "@/lib/theme";

export type AnalyticsMetrics = {
  leadConversion: number;
  openLeadValue: number;
  quoteAcceptance: number;
  acceptedQuoteValue: number;
  jobCompletion: number;
  completedJobs: number;
  totalJobs: number;
  paidRevenue: number;
  overdueReceivables: number;
  outstandingPayables: number;
  averageRating: number;
  reviewCount: number;
  approvedHours: number;
  pendingHours: number;
};

function money(value: number) {
  return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function pct(value: number) {
  return `${value.toFixed(0)}%`;
}

export default function AnalyticsView({ metrics }: { metrics: AnalyticsMetrics }) {
  return (
    <>
      <TopBar title="Analytics" subtitle="Operational performance across sales, jobs, finance, reputation and crew hours" />
      <div className="flex-1 overflow-auto p-4 md:p-8 space-y-5">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Metric label="Lead conversion" value={pct(metrics.leadConversion)} hint={`${money(metrics.openLeadValue)} open lead value`} />
          <Metric label="Quote acceptance" value={pct(metrics.quoteAcceptance)} hint={`${money(metrics.acceptedQuoteValue)} accepted`} />
          <Metric label="Job completion" value={pct(metrics.jobCompletion)} hint={`${metrics.completedJobs} of ${metrics.totalJobs} complete/invoiced`} />
          <Metric label="Average review" value={metrics.reviewCount ? `${metrics.averageRating.toFixed(1)} / 5` : "—"} hint={`${metrics.reviewCount} reviews`} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Financial health" href="/dashboard" linkLabel="Open dashboard">
            <Row label="Paid client revenue" value={money(metrics.paidRevenue)} />
            <Row label="Overdue receivables" value={money(metrics.overdueReceivables)} alert={metrics.overdueReceivables > 0} />
            <Row label="Outstanding supplier bills" value={money(metrics.outstandingPayables)} />
          </Panel>

          <Panel title="Crew hours" href="/timesheets" linkLabel="Open timesheets">
            <Row label="Approved hours" value={metrics.approvedHours.toFixed(1)} />
            <Row label="Pending approval" value={metrics.pendingHours.toFixed(1)} alert={metrics.pendingHours > 0} />
            <Progress label="Approved share" value={metrics.approvedHours + metrics.pendingHours > 0 ? (metrics.approvedHours / (metrics.approvedHours + metrics.pendingHours)) * 100 : 0} />
          </Panel>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProgressCard title="Sales conversion" value={metrics.leadConversion} href="/leads" />
          <ProgressCard title="Quote acceptance" value={metrics.quoteAcceptance} href="/quotes" />
          <ProgressCard title="Job completion" value={metrics.jobCompletion} href="/jobs" />
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: COLORS.textMute }}>{hint}</div>
    </div>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>{title}</h2>
        <Link className="text-xs font-semibold" style={{ color: COLORS.accent }} href={href}>{linkLabel}</Link>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span style={{ color: COLORS.textMute }}>{label}</span>
      <span className="font-semibold" style={{ color: alert ? COLORS.coral : COLORS.text }}>{value}</span>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span style={{ color: COLORS.textMute }}>{label}</span><span style={{ color: COLORS.text }}>{pct(bounded)}</span></div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: COLORS.cardAlt }}><div className="h-full rounded-full" style={{ width: `${bounded}%`, background: COLORS.accent }} /></div>
    </div>
  );
}

function ProgressCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg p-5 block" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>{title}</div>
      <Progress label="Performance" value={value} />
    </Link>
  );
}
