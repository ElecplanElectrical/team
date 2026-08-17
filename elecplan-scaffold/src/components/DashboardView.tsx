"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  ReceiptText,
  Users,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS } from "@/lib/theme";

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
  clients: number;
  quoteCount: number;
  invoiceCount: number;
};

function money(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardView({ metrics }: { metrics: DashboardMetrics }) {
  const grossCash = metrics.paidRevenue - metrics.paidSupplierBills;
  const cards = [
    { label: "Quote pipeline", value: money(metrics.quotePipeline), detail: `${metrics.quoteCount} total quotes`, icon: FileText },
    { label: "Accepted quotes", value: money(metrics.acceptedQuotes), detail: "Won quote value", icon: CircleDollarSign },
    { label: "Receivables", value: money(metrics.receivables), detail: `${metrics.overdueCount} overdue item${metrics.overdueCount === 1 ? "" : "s"}`, icon: ReceiptText },
    { label: "Payables", value: money(metrics.payables), detail: "Outstanding supplier bills", icon: ReceiptText },
  ];

  return (
    <>
      <TopBar title="Dashboard" subtitle="Operational and financial overview" />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textFaint }}>{label}</span>
                <Icon size={16} style={{ color: COLORS.accent }} />
              </div>
              <div className="text-2xl font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.mono }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: COLORS.textMute }}>{detail}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: COLORS.text }}>Cash snapshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Client invoices paid" value={money(metrics.paidRevenue)} />
              <Stat label="Supplier bills paid" value={money(metrics.paidSupplierBills)} />
              <Stat label="Net paid cash" value={money(grossCash)} />
            </div>
            <p className="text-xs mt-4" style={{ color: COLORS.textFaint }}>
              This is an operational cash view from Elecplan records, not an accounting profit figure. Xero will become the accounting source of truth once connected.
            </p>
          </section>

          <section className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: COLORS.text }}>Operations</h2>
            <div className="flex flex-col gap-3">
              <MiniStat icon={BriefcaseBusiness} label="Active jobs" value={String(metrics.activeJobs)} />
              <MiniStat icon={BriefcaseBusiness} label="Completed / invoiced" value={String(metrics.completedJobs)} />
              <MiniStat icon={Users} label="Clients" value={String(metrics.clients)} />
              <MiniStat icon={ReceiptText} label="Financial records" value={String(metrics.invoiceCount)} />
            </div>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <QuickLink href="/quotes" title="Quotes" detail="Manage the quote pipeline and accepted value." />
          <QuickLink href="/bills" title="Bills & invoices" detail="Track receivables, payables and due dates." />
          <QuickLink href="/jobs" title="Jobs" detail="Review current workload and delivery status." />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-4" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.borderSoft}` }}>
      <div className="text-xs" style={{ color: COLORS.textMute }}>{label}</div>
      <div className="text-lg font-semibold mt-1" style={{ color: COLORS.text, fontFamily: FONTS.mono }}>{value}</div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: COLORS.cardAlt }}><Icon size={15} style={{ color: COLORS.accent }} /></div>
      <div className="flex-1">
        <div className="text-xs" style={{ color: COLORS.textMute }}>{label}</div>
        <div className="text-sm font-semibold" style={{ color: COLORS.text }}>{value}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="rounded-lg p-5 flex items-start justify-between gap-4 hover:opacity-90" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: COLORS.text }}>{title}</div>
        <div className="text-xs mt-1" style={{ color: COLORS.textMute }}>{detail}</div>
      </div>
      <ArrowUpRight size={16} style={{ color: COLORS.accent }} />
    </Link>
  );
}
