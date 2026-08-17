"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ReceiptText,
} from "lucide-react";
import TopBar from "@/components/TopBar";

const UI = {
  panel: "#07182b",
  panelAlt: "#0a2038",
  border: "rgba(77, 150, 221, 0.24)",
  borderSoft: "rgba(77, 150, 221, 0.13)",
  text: "#f6f9ff",
  mute: "#94a8c2",
  faint: "#627892",
  blue: "#1592ff",
  cyan: "#25c7ff",
  green: "#13d7a0",
  orange: "#ff9f1c",
  purple: "#8257f6",
  red: "#ff4d67",
};

type DashboardMetrics = {
  quotePipeline: number;
  acceptedQuotes: number;
  receivables: number;
  payables: number;
  paidRevenue: number;
  paidSupplierBills: number;
  overdueCount: number;
  activeJobs: number;
  completedJobs: number;
  quotedJobs: number;
  scheduledJobs: number;
  clients: number;
  quoteCount: number;
  invoiceCount: number;
};

type UpcomingJob = {
  id: string;
  title: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: string;
  assignedTo: string | null;
  client: string;
};

type ActivityRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
};

type CashPoint = { label: string; value: number };

function money(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

function titleCaseAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardView({
  metrics,
  upcomingJobs,
  activity,
  cashSeries,
}: {
  metrics: DashboardMetrics;
  upcomingJobs: UpcomingJob[];
  activity: ActivityRow[];
  cashSeries: CashPoint[];
}) {
  const grossCash = metrics.paidRevenue - metrics.paidSupplierBills;
  const totalJobs = metrics.activeJobs + metrics.completedJobs + metrics.quotedJobs + metrics.scheduledJobs;
  const jobSegments = [
    { label: "In progress", value: metrics.activeJobs, color: UI.blue },
    { label: "Completed", value: metrics.completedJobs, color: UI.green },
    { label: "Quoted", value: metrics.quotedJobs, color: UI.purple },
    { label: "Scheduled", value: metrics.scheduledJobs, color: UI.orange },
  ];
  const donutTotal = Math.max(1, jobSegments.reduce((sum, item) => sum + item.value, 0));
  let cursor = 0;
  const gradient = jobSegments.map((item) => {
    const start = (cursor / donutTotal) * 360;
    cursor += item.value;
    const end = (cursor / donutTotal) * 360;
    return `${item.color} ${start}deg ${end}deg`;
  }).join(", ");

  const cards = [
    { label: "Quote pipeline", value: money(metrics.quotePipeline), detail: `${metrics.quoteCount} quotes`, icon: FileText, color: UI.blue },
    { label: "Accepted quotes", value: money(metrics.acceptedQuotes), detail: "Won quote value", icon: CheckCircle2, color: UI.green },
    { label: "Receivables", value: money(metrics.receivables), detail: `${metrics.overdueCount} overdue`, icon: CircleDollarSign, color: UI.orange },
    { label: "Payables", value: money(metrics.payables), detail: "Supplier bills", icon: ReceiptText, color: UI.purple },
  ];

  return (
    <>
      <TopBar title="Dashboard" subtitle="Operational and financial overview" />
      <div className="flex-1 overflow-auto px-4 pb-7 pt-3 md:px-6 xl:px-7 xl:pb-8" style={{ background: "radial-gradient(circle at 52% 4%, rgba(15,91,163,.15), transparent 32%), #03101f" }}>
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, detail, icon: Icon, color }) => (
              <section key={label} className="rounded-xl p-4 shadow-[0_18px_45px_rgba(0,0,0,.18)]" style={{ background: "linear-gradient(145deg, rgba(11,35,60,.96), rgba(5,24,43,.96))", border: `1px solid ${UI.border}` }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}18`, color, boxShadow: `inset 0 0 0 1px ${color}32` }}>
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: UI.mute }}>{label}</p>
                    <p className="mt-1 truncate text-[22px] font-semibold leading-tight" style={{ color: UI.text }}>{value}</p>
                    <p className="mt-1 text-[11px] font-medium" style={{ color }}>{detail}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Jobs overview" action={{ href: "/jobs", label: "View all jobs" }}>
              <div className="grid min-h-[230px] items-center gap-6 sm:grid-cols-[190px_1fr]">
                <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: `conic-gradient(${gradient})`, boxShadow: "0 0 38px rgba(21,146,255,.12)" }}>
                  <div className="absolute inset-[24px] flex flex-col items-center justify-center rounded-full" style={{ background: "#07182b", border: `1px solid ${UI.borderSoft}` }}>
                    <strong className="text-3xl" style={{ color: UI.text }}>{totalJobs}</strong>
                    <span className="text-xs" style={{ color: UI.mute }}>Total jobs</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {jobSegments.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: UI.borderSoft }}>
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                      <span className="flex-1 text-sm" style={{ color: UI.mute }}>{item.label}</span>
                      <strong className="text-sm" style={{ color: UI.text }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Upcoming schedule" action={{ href: "/calendar", label: "View full calendar" }}>
              <div className="min-h-[230px] divide-y" style={{ borderColor: UI.borderSoft }}>
                {upcomingJobs.length > 0 ? upcomingJobs.map((job) => (
                  <div key={job.id} className="grid grid-cols-[54px_1fr] gap-3 py-3 first:pt-0" style={{ borderColor: UI.borderSoft }}>
                    <DateBadge value={job.scheduledStart} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold" style={{ color: UI.text }}>{job.title}</p>
                        <span className="ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: "rgba(21,146,255,.16)", color: UI.cyan }}>Scheduled</span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: UI.mute }}>{formatTimeRange(job.scheduledStart, job.scheduledEnd)}</p>
                      <p className="mt-1 truncate text-[11px]" style={{ color: UI.faint }}>{job.client}{job.assignedTo ? ` · ${job.assignedTo}` : ""}</p>
                    </div>
                  </div>
                )) : (
                  <EmptyState icon={CalendarDays} text="No upcoming scheduled jobs." />
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Recent activity" action={{ href: "/settings/audit", label: "View audit log" }}>
              <div className="min-h-[250px]">
                {activity.length > 0 ? activity.map((item, index) => (
                  <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < activity.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px" style={{ background: UI.border }} />}
                    <span className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4" style={{ background: index % 3 === 0 ? UI.blue : index % 3 === 1 ? UI.green : UI.orange, borderColor: "#07182b" }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: UI.text }}>{titleCaseAction(item.action)}</p>
                      <p className="mt-1 text-[11px]" style={{ color: UI.faint }}>{item.entityType} · {timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <EmptyState icon={BriefcaseBusiness} text="Activity will appear as the team uses Elecplan." />
                )}
              </div>
            </Panel>

            <Panel title="Cash flow" badge="Last 7 days">
              <CashChart series={cashSeries} />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniMoney label="Client paid" value={metrics.paidRevenue} />
                <MiniMoney label="Bills paid" value={metrics.paidSupplierBills} />
                <MiniMoney label="Net paid" value={grossCash} />
              </div>
              <p className="mt-3 text-[10px] leading-4" style={{ color: UI.faint }}>Operational Elecplan cash view only. It is not an accounting profit figure.</p>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

function Panel({ title, children, action, badge }: { title: string; children: React.ReactNode; action?: { href: string; label: string }; badge?: string }) {
  return (
    <section className="rounded-xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(8,29,51,.98), rgba(5,22,40,.98))", border: `1px solid ${UI.border}`, boxShadow: "0 20px 60px rgba(0,0,0,.16)" }}>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-sm font-semibold" style={{ color: UI.text }}>{title}</h2>
        {badge && <span className="ml-auto rounded-md px-2.5 py-1 text-[10px]" style={{ color: UI.mute, border: `1px solid ${UI.border}` }}>{badge}</span>}
      </div>
      {children}
      {action && (
        <Link href={action.href} className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: UI.cyan }}>
          {action.label} <ArrowRight size={13} />
        </Link>
      )}
    </section>
  );
}

function DateBadge({ value }: { value: string | null }) {
  if (!value) return <div />;
  const date = new Date(value);
  return (
    <div className="flex h-14 w-12 flex-col items-center justify-center rounded-lg" style={{ background: "rgba(21,146,255,.11)", border: `1px solid rgba(21,146,255,.26)` }}>
      <span className="text-[10px] font-semibold uppercase" style={{ color: UI.cyan }}>{date.toLocaleDateString("en-AU", { weekday: "short" })}</span>
      <strong className="text-lg leading-5" style={{ color: UI.text }}>{date.getDate()}</strong>
    </div>
  );
}

function formatTimeRange(start: string | null, end: string | null) {
  if (!start) return "Time not set";
  const formatter = new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
  return end ? `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}` : formatter.format(new Date(start));
}

function EmptyState({ icon: Icon, text }: { icon: typeof CalendarDays; text: string }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(21,146,255,.12)", color: UI.cyan }}><Icon size={18} /></div>
      <p className="max-w-xs text-xs" style={{ color: UI.mute }}>{text}</p>
    </div>
  );
}

function MiniMoney({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(9,31,54,.72)", border: `1px solid ${UI.borderSoft}` }}>
      <p className="text-[10px]" style={{ color: UI.faint }}>{label}</p>
      <p className="mt-1 truncate text-sm font-semibold" style={{ color: UI.text }}>{money(value)}</p>
    </div>
  );
}

function CashChart({ series }: { series: CashPoint[] }) {
  const width = 520;
  const height = 180;
  const values = series.map((item) => item.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = Math.max(1, max - min);
  const points = series.map((item, index) => {
    const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
    const y = height - ((item.value - min) / range) * (height - 24) - 12;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(3,17,31,.38)", border: `1px solid ${UI.borderSoft}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Seven day operational cash chart">
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="rgba(90,129,165,.13)" strokeWidth="1" />)}
        <defs>
          <linearGradient id="cashArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={UI.blue} stopOpacity=".32" />
            <stop offset="100%" stopColor={UI.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#cashArea)" />
        <polyline points={points} fill="none" stroke={UI.blue} strokeWidth="3" vectorEffect="non-scaling-stroke" />
        {series.map((item, index) => {
          const [x, y] = points.split(" ")[index].split(",").map(Number);
          return <circle key={item.label} cx={x} cy={y} r="4" fill={UI.cyan} stroke="#07182b" strokeWidth="2" />;
        })}
      </svg>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px]" style={{ color: UI.faint }}>
        {series.map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </div>
  );
}
