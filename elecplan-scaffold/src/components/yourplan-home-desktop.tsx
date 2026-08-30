import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleEllipsis,
  FileText,
  Hammer,
  Leaf,
  Package,
  Users,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";
import { DashboardPreview, Wordmark } from "@/components/yourplan-public";

const nav = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
] as const;

const modules = [
  ["Jobs", BriefcaseBusiness],
  ["Leads & CRM", Users],
  ["Quotes", FileText],
  ["Invoices", WalletCards],
  ["Calendar", CalendarDays],
  ["Staff", Users],
  ["Timesheets", Bell],
  ["Documents", FileText],
  ["Stock", Package],
  ["Reminders", Bell],
  ["Reporting", BarChart3],
  ["AI & Automation", Bot],
] as const;

const industries = [
  ["Electrical", Zap],
  ["Landscaping", Leaf],
  ["Mechanical", Wrench],
  ["Trades", Hammer],
  ["Service Businesses", Building2],
] as const;

export function DesktopHomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05080c] text-white [font-family:Inter,sans-serif]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_72%_35%,rgba(20,130,255,.18),transparent_30%),radial-gradient(circle_at_18%_8%,rgba(255,255,255,.08),transparent_24%),linear-gradient(135deg,#15191e_0%,#0b0f14_38%,#05080c_72%)]">
        <header className="relative z-20 border-b border-white/[.045]">
          <div className="mx-auto flex h-[84px] w-full max-w-[1360px] items-center px-10">
            <div className="w-[210px]"><Wordmark /></div>
            <nav className="flex flex-1 items-center justify-center gap-9" aria-label="Primary navigation">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="text-[12px] font-medium text-slate-300 transition hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex w-[210px] items-center justify-end gap-3">
              <Link href="/login" className="inline-flex h-10 items-center rounded-md border border-white/15 px-5 text-[12px] font-semibold text-white hover:border-white/30">
                Login
              </Link>
              <Link href="/contact" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#168dff] px-5 text-[12px] font-semibold text-white shadow-[0_0_24px_rgba(22,141,255,.23)]">
                Book a Demo <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>

        <section className="relative mx-auto grid min-h-[610px] w-full max-w-[1360px] grid-cols-[.82fr_1.18fr] items-center gap-10 px-10 pb-14 pt-14">
          <div className="relative z-10 max-w-[520px]">
            <h1 className="text-[66px] font-black uppercase leading-[.98] tracking-[-.055em]">
              <span className="text-[#168dff]">YOUR</span> BUSINESS.<br />
              <span className="text-[#168dff]">YOUR</span> WAY.<br />
              <span className="text-[#168dff]">YOUR</span> PLAN.
            </h1>
            <p className="mt-7 max-w-[470px] text-[18px] font-semibold leading-7 text-white">
              One platform built around the way your business actually works.
            </p>
            <p className="mt-4 max-w-[500px] text-[14px] leading-6 text-slate-300">
              Manage jobs, scheduling, clients, staff, quotes, invoices, timesheets, stock, documents, reminders, reporting and more — all from one place.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href="/contact" className="inline-flex h-12 items-center gap-3 rounded-md bg-[#168dff] px-7 text-[13px] font-semibold shadow-[0_0_30px_rgba(22,141,255,.30)]">
                Book a Demo <ArrowRight size={16} />
              </Link>
              <Link href="/features" className="inline-flex h-12 items-center rounded-md border border-white/22 bg-black/10 px-7 text-[13px] font-semibold text-white">
                See Features
              </Link>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
              <span>Powered by</span>
              <span className="normal-case tracking-[-.06em]"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></span>
            </div>
          </div>

          <div className="relative z-10 min-w-0">
            <div className="pointer-events-none absolute inset-x-[7%] bottom-[5%] top-[8%] rounded-[80px] bg-[#168dff]/18 blur-[75px]" />
            <div className="relative scale-[1.02] origin-center">
              <DashboardPreview />
            </div>
          </div>
        </section>
      </div>

      <section className="border-y border-[#44a8ff]/30 bg-[linear-gradient(180deg,#117ff5_0%,#0871df_100%)] shadow-[0_8px_42px_rgba(0,96,210,.22)]">
        <div className="mx-auto grid w-full max-w-[1360px] grid-cols-12 px-5">
          {modules.map(([label, Icon], index) => (
            <Link key={label} href={index === 11 ? "/features" : "/features"} className="flex min-h-[92px] flex-col items-center justify-center gap-2 border-r border-white/12 px-2 text-center last:border-r-0 hover:bg-white/[.04]">
              <Icon size={21} strokeWidth={1.65} />
              <span className="text-[9px] font-semibold leading-3 text-white">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_65%_10%,rgba(22,141,255,.08),transparent_28%),#05080c]">
        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-[.9fr_1.1fr] gap-16 px-10 py-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#168dff]">Simple, transparent pricing</p>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-[62px] font-black leading-none tracking-[-.055em] text-[#168dff]">$50</span>
              <span className="pb-2 text-[20px] font-semibold text-white">/ month</span>
            </div>
            <div className="mt-7 grid gap-3 text-[13px] text-slate-300">
              {["$0 standard setup fee", "Free trial available on request", "Cancel anytime", "Custom add-ons quoted separately"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#168dff]/35 bg-[#168dff]/10 text-[11px] text-[#168dff]">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold text-white hover:text-[#65b7ff]">
              View pricing <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#168dff]">Built for your industry</p>
            <h2 className="mt-4 max-w-[570px] text-[32px] font-bold leading-[1.12] tracking-[-.035em]">YourPlan adapts to your business, not the other way around.</h2>
            <div className="mt-8 grid grid-cols-5 gap-3">
              {industries.map(([label, Icon]) => (
                <div key={label} className="flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-lg border border-white/[.08] bg-white/[.025] px-3 text-center">
                  <Icon size={25} strokeWidth={1.55} className="text-[#168dff]" />
                  <span className="text-[10px] font-medium leading-4 text-slate-200">{label}</span>
                </div>
              ))}
            </div>
            <Link href="/industries" className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-white hover:text-[#65b7ff]">
              Explore industries <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[.07] bg-[#030609]">
        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-[1.2fr_.72fr_.72fr_.72fr_1.35fr] gap-10 px-10 py-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#168dff]/45 bg-[#08131e] text-[16px] font-bold"><span className="text-[#168dff]">Y</span>P</div>
              <div>
                <p className="text-[9px] uppercase tracking-[.13em] text-slate-500">Powered by</p>
                <div className="mt-0.5"><Wordmark compact /></div>
              </div>
            </div>
            <p className="mt-5 max-w-[230px] text-[12px] leading-5 text-slate-400">One platform. Built for your business.</p>
          </div>

          <FooterColumn title="Product" links={[["Features", "/features"], ["Pricing", "/pricing"], ["Industries", "/industries"]]} />
          <FooterColumn title="Company" links={[["About Us", "/about"], ["Contact Us", "/contact"], ["Login", "/login"]]} />
          <FooterColumn title="Resources" links={[["Resources", "/resources"], ["Help Centre", "/resources"], ["Guides", "/resources"]]} />

          <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-6">
            <h3 className="text-[17px] font-semibold">Ready to transform your business?</h3>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Book a demo today and see how YourPlan can fit the way you work.</p>
            <Link href="/contact" className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#168dff] px-5 text-[11px] font-semibold">
              Book a Demo <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/[.06]">
          <div className="mx-auto flex h-14 w-full max-w-[1220px] items-center justify-between px-10 text-[10px] text-slate-500">
            <span>© 2026 YourPlan. All rights reserved.</span>
            <div className="flex items-center gap-7">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <span className="text-sm font-semibold text-white">f</span>
              <span className="text-[11px] font-semibold text-white">in</span>
              <CircleEllipsis size={14} className="text-white" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white">{title}</p>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="text-[11px] text-slate-400 hover:text-white">{label}</Link>
        ))}
      </div>
    </div>
  );
}
