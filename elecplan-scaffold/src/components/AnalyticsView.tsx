import Link from "next/link";
import { BarChart3, CircleDollarSign, Star, UsersRound } from "lucide-react";
import TopBar from "@/components/TopBar";

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

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72", orange: "#ff9f1c" };
const money = (value: number) => value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const pct = (value: number) => `${value.toFixed(0)}%`;

export default function AnalyticsView({ metrics }: { metrics: AnalyticsMetrics }) {
  return <>
    <TopBar title="Analytics" subtitle="Operational performance across sales, jobs, finance, reputation and crew hours" />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<BarChart3 size={17} />} label="Lead conversion" value={pct(metrics.leadConversion)} hint={`${money(metrics.openLeadValue)} open lead value`} /><Metric icon={<CircleDollarSign size={17} />} label="Quote acceptance" value={pct(metrics.quoteAcceptance)} hint={`${money(metrics.acceptedQuoteValue)} accepted`} /><Metric icon={<UsersRound size={17} />} label="Job completion" value={pct(metrics.jobCompletion)} hint={`${metrics.completedJobs} of ${metrics.totalJobs} complete/invoiced`} /><Metric icon={<Star size={17} />} label="Average review" value={metrics.reviewCount ? `${metrics.averageRating.toFixed(1)} / 5` : "—"} hint={`${metrics.reviewCount} reviews`} /></section>
      <section className="grid gap-4 xl:grid-cols-2"><Panel title="Financial health" href="/dashboard" linkLabel="Open dashboard"><Row label="Paid client revenue" value={money(metrics.paidRevenue)} /><Row label="Overdue receivables" value={money(metrics.overdueReceivables)} alert={metrics.overdueReceivables > 0} /><Row label="Outstanding supplier bills" value={money(metrics.outstandingPayables)} /><Progress label="Receivables health" value={metrics.paidRevenue + metrics.overdueReceivables > 0 ? (metrics.paidRevenue / (metrics.paidRevenue + metrics.overdueReceivables)) * 100 : 0} /></Panel><Panel title="Crew hours" href="/timesheets" linkLabel="Open timesheets"><Row label="Approved hours" value={metrics.approvedHours.toFixed(1)} /><Row label="Pending approval" value={metrics.pendingHours.toFixed(1)} alert={metrics.pendingHours > 0} /><Progress label="Approved share" value={metrics.approvedHours + metrics.pendingHours > 0 ? (metrics.approvedHours / (metrics.approvedHours + metrics.pendingHours)) * 100 : 0} /></Panel></section>
      <section className="grid gap-4 lg:grid-cols-3"><ProgressCard title="Sales conversion" value={metrics.leadConversion} href="/leads" /><ProgressCard title="Quote acceptance" value={metrics.quoteAcceptance} href="/quotes" /><ProgressCard title="Job completion" value={metrics.jobCompletion} href="/jobs" /></section>
    </div></div>
  </>;
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="flex items-center gap-2 text-[11px]" style={{ color: UI.faint }}><span style={{ color: UI.cyan }}>{icon}</span>{label}</div><div className="mt-2 text-2xl font-semibold" style={{ color: UI.text }}>{value}</div><div className="mt-1 text-xs" style={{ color: UI.mute }}>{hint}</div></div>; }
function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) { return <div className="rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold" style={{ color: UI.text }}>{title}</h2><Link className="text-xs font-semibold" style={{ color: UI.cyan }} href={href}>{linkLabel}</Link></div><div className="space-y-3">{children}</div></div>; }
function Row({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) { return <div className="flex items-center justify-between gap-4 text-sm"><span style={{ color: UI.mute }}>{label}</span><span className="font-semibold" style={{ color: alert ? UI.red : UI.text }}>{value}</span></div>; }
function Progress({ label, value }: { label: string; value: number }) { const bounded = Math.max(0, Math.min(100, value)); return <div><div className="mb-1.5 flex justify-between text-xs"><span style={{ color: UI.mute }}>{label}</span><span style={{ color: UI.text }}>{pct(bounded)}</span></div><div className="h-2 overflow-hidden rounded-full" style={{ background: UI.panelAlt }}><div className="h-full rounded-full" style={{ width: `${bounded}%`, background: UI.blue }} /></div></div>; }
function ProgressCard({ title, value, href }: { title: string; value: number; href: string }) { return <Link href={href} className="block rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="mb-3 text-sm font-semibold" style={{ color: UI.text }}>{title}</div><Progress label="Performance" value={value} /></Link>; }
