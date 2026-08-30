import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleEllipsis,
  Clock,
  FileText,
  Hammer,
  HelpCircle,
  Leaf,
  Mail,
  Menu,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";

const nav = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
] as const;

const featureRows = [
  ["Jobs", "Manage work from creation through to completion.", BriefcaseBusiness],
  ["Scheduling", "See what’s happening, who’s doing it and when.", CalendarDays],
  ["Clients & Leads", "Keep customer information, opportunities and communication organised.", Users],
  ["Quotes & Invoices", "Create, manage and track your business documents.", WalletCards],
  ["Staff & Timesheets", "Manage your team, access and working hours.", Users],
  ["Documents", "Store important business and job files where your team can access them.", FileText],
  ["Stock & Materials", "Keep track of stock, materials and what you need.", Package],
  ["Reports", "See what’s happening across your business.", BarChart3],
  ["Reminders & Automation", "Reduce repetitive admin and make sure important things don’t get missed.", Bell],
  ["AI & Automation", "Automate tasks and get intelligent assistance when you need it.", Bot],
] as const;

const moduleStrip = [
  ["Jobs", BriefcaseBusiness],
  ["Leads", Users],
  ["Quotes", FileText],
  ["Calendar", CalendarDays],
  ["Staff", Users],
  ["Docs", FileText],
  ["Stock", Package],
  ["More", CircleEllipsis],
] as const;

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="YourPlan home"
      className={`inline-flex items-baseline [font-family:Sora,Inter,sans-serif] font-medium tracking-[-.075em] ${compact ? "text-[21px]" : "text-[25px] md:text-[27px]"}`}
    >
      <span className="text-[#168dff]">Your</span>
      <span className="text-white">plan</span>
    </Link>
  );
}

function Header({ active }: { active?: string }) {
  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-7 lg:h-[74px] lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`relative py-2 text-[12px] font-medium transition ${active === label ? "text-white" : "text-slate-300 hover:text-white"}`}
            >
              {label}
              {active === label ? <span className="absolute inset-x-0 -bottom-1 h-px bg-[#168dff]" /> : null}
            </Link>
          ))}
        </nav>
        <details className="group relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-center rounded-md p-2 text-white marker:hidden" aria-label="Open menu">
            <Menu size={25} strokeWidth={1.8} />
          </summary>
          <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-white/10 bg-[#06111b] p-2 shadow-2xl">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                {label}
              </Link>
            ))}
            <Link href="/login" className="mt-1 block rounded-lg border border-white/10 px-3 py-2 text-sm text-white">
              Login
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto hidden border-t border-white/[.07] lg:block">
      <div className="mx-auto flex h-[54px] w-full max-w-[1180px] items-center justify-between px-8 text-[10px] text-slate-500">
        <span>© 2025 YourPlan. All rights reserved.</span>
        <div className="flex items-center gap-8">
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <span className="text-sm font-semibold text-white">f</span>
          <span className="text-[11px] font-semibold text-white">in</span>
          <span className="text-[12px] text-white">▶</span>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_18%_0%,rgba(11,61,101,.18),transparent_32%),linear-gradient(180deg,#020b12_0%,#020a11_100%)] text-white [font-family:Inter,sans-serif]">
      <Header active={active} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </main>
  );
}

export function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020a12] text-white [font-family:Inter,sans-serif]">
      <Header />
      <section className="relative overflow-hidden px-5 pb-0 pt-2 sm:px-7">
        <div className="pointer-events-none absolute left-1/2 top-[58%] h-[360px] w-[92%] -translate-x-1/2 rounded-full bg-[#168dff]/10 blur-[70px]" />
        <div className="relative mx-auto max-w-[540px]">
          <h1 className="mt-4 text-[34px] font-black uppercase leading-[1.12] tracking-[-.045em] sm:text-[40px]">
            <span className="text-[#168dff]">YOUR</span> BUSINESS.<br />
            <span className="text-[#168dff]">YOUR</span> WAY.<br />
            <span className="text-[#168dff]">YOUR</span> PLAN.
          </h1>
          <p className="mt-4 max-w-[370px] text-[14px] font-semibold leading-5 text-white">
            One platform built around the way your business actually works.
          </p>
          <p className="mt-3 max-w-[420px] text-[13px] leading-5 text-slate-300">
            Manage jobs, scheduling, clients, staff, quotes, invoices, timesheets, stock, documents, reminders, reporting and more — all from one place.
          </p>
          <div className="mt-5 flex max-w-[330px] flex-col gap-2">
            <Link href="/contact" className="inline-flex h-10 items-center justify-center gap-3 rounded bg-[#0d78ff] px-5 text-[12px] font-semibold shadow-[0_0_22px_rgba(22,141,255,.25)]">
              Book a Demo <ArrowRight size={15} />
            </Link>
            <Link href="/features" className="inline-flex h-10 items-center justify-center rounded border border-white/35 bg-[#07111b] px-5 text-[12px] font-semibold">
              See Features
            </Link>
          </div>
          <DashboardPreview compact />
          <div className="my-4 text-center text-[9px] font-medium uppercase tracking-[.14em] text-slate-500">
            Powered by <span className="ml-1 normal-case tracking-[-.06em]"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></span>
          </div>
        </div>
      </section>
      <section className="border-t border-[#168dff]/35 bg-[linear-gradient(180deg,#0b72e7,#0756b7)]">
        <div className="mx-auto grid max-w-[540px] grid-cols-4">
          {moduleStrip.map(([name, Icon]) => (
            <div key={name} className="flex min-h-[58px] flex-col items-center justify-center gap-1 border-r border-white/10 px-1 text-[9px] font-medium last:border-r-0">
              <Icon size={17} strokeWidth={1.75} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function InfoPage({ kind }: { kind: "features" | "pricing" | "about" | "industries" | "resources" | "contact" }) {
  if (kind === "features") return <FeaturesPage />;
  if (kind === "pricing") return <PricingPage />;
  if (kind === "about") return <AboutPage />;
  if (kind === "industries") return <IndustriesPage />;
  if (kind === "resources") return <ResourcesPage />;
  return <ContactPage />;
}

function FeaturesPage() {
  const left = featureRows.slice(0, 5);
  const right = featureRows.slice(5);
  return (
    <PageShell active="Features">
      <section className="mx-auto w-full max-w-[1180px] flex-1 px-5 pb-8 pt-4 sm:px-7 lg:px-8 lg:pb-5 lg:pt-3">
        <div className="grid gap-7 lg:grid-cols-[1fr_.92fr] lg:items-start">
          <div className="max-w-[510px]">
            <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#168dff] lg:text-[9px]">Features</p>
            <h1 className="mt-3 text-[31px] font-bold leading-[1.08] tracking-[-.035em] sm:text-[36px] lg:text-[30px]">
              Everything your business<br className="hidden sm:block" /> needs. One place.
            </h1>
            <p className="mt-4 max-w-[410px] text-[13px] leading-[1.55] text-slate-300 lg:text-[12px]">
              Running a business shouldn’t mean jumping between five different systems. YourPlan brings the everyday parts of your business together in one platform.
            </p>
          </div>
          <FeatureHub />
        </div>
        <div className="mt-7 grid gap-3 lg:mt-6 lg:grid-cols-2 lg:gap-4">
          <FeaturePanel rows={left} />
          <FeaturePanel rows={right} />
        </div>
      </section>
    </PageShell>
  );
}

function FeaturePanel({ rows }: { rows: readonly (readonly [string, string, ComponentType<{ size?: number; className?: string; strokeWidth?: number }>])[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[.10] bg-[#06121c]">
      {rows.map(([name, text, Icon], index) => (
        <div key={name} className={`flex gap-4 px-4 py-4 ${index ? "border-t border-white/[.06]" : ""}`}>
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#168dff]/20 bg-[#06233b] text-[#168dff]">
            <Icon size={17} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-white">{name}</h2>
            <p className="mt-1 max-w-[430px] text-[11px] leading-[1.45] text-slate-400">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureHub() {
  const nodes = [
    ["Jobs", BriefcaseBusiness, "left-1/2 top-0 -translate-x-1/2"],
    ["Quotes", FileText, "right-3 top-5"],
    ["Calendar", CalendarDays, "right-0 bottom-5"],
    ["Staff", Users, "left-0 bottom-5"],
    ["Clients", Users, "left-3 top-5"],
  ] as const;
  return (
    <div className="relative mx-auto hidden h-[170px] w-full max-w-[340px] lg:block">
      <svg viewBox="0 0 340 170" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <line x1="170" y1="85" x2="170" y2="30" stroke="#168dff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
        <line x1="170" y1="85" x2="275" y2="45" stroke="#168dff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
        <line x1="170" y1="85" x2="292" y2="130" stroke="#168dff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
        <line x1="170" y1="85" x2="48" y2="130" stroke="#168dff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
        <line x1="170" y1="85" x2="64" y2="45" stroke="#168dff" strokeWidth="1.2" strokeDasharray="4 5" opacity=".7" />
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#168dff] bg-[#061521] shadow-[0_0_26px_rgba(22,141,255,.18)]" style={{ height: 64, width: 64 }}>
        <span className="text-[26px] font-medium tracking-[-.06em]"><span className="text-[#168dff]">Y</span>P</span>
      </div>
      {nodes.map(([label, Icon, pos]) => (
        <div key={label} className={`absolute flex h-[66px] w-[74px] flex-col items-center justify-center gap-2 rounded-lg border border-white/[.11] bg-[#08141f] text-[9px] ${pos}`}>
          <Icon size={20} className="text-slate-100" strokeWidth={1.6} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function PricingPage() {
  const inclusions = [
    "Standard YourPlan platform included",
    "$0 standard setup fee",
    "Your branding and colours",
    "Your selected standard modules",
    "Cancel anytime",
    "Free trial available on request",
    "Updates to the standard platform included",
  ];
  return (
    <PageShell active="Pricing">
      <section className="mx-auto w-full max-w-[980px] flex-1 px-5 pb-8 pt-4 sm:px-7 lg:px-8 lg:pt-7">
        <p className="text-[10px] uppercase tracking-[.12em] text-slate-400">Pricing</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-.035em] lg:text-[29px]">Simple, transparent pricing.</h1>
        <p className="mt-3 text-[13px] text-slate-300">One platform. No lock-in contracts.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/[.11] bg-[#07131d] p-5 sm:p-6 lg:min-h-[330px] lg:p-7">
            <div className="flex items-end gap-2">
              <span className="text-[55px] font-semibold leading-none tracking-[-.05em] text-[#168dff]">$50</span>
              <span className="pb-1 text-[15px] text-white">/month</span>
            </div>
            <p className="mt-3 text-[12px] text-white">One business. One platform.</p>
            <div className="mt-5 space-y-3">
              {inclusions.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[11px] leading-[1.35] text-slate-300">
                  <Check size={13} className="mt-0.5 shrink-0 text-[#168dff]" strokeWidth={2.2} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/[.11] bg-[#07131d] p-5 sm:p-6 lg:min-h-[330px] lg:p-7">
            <h2 className="text-[16px] font-semibold">Need something unique?</h2>
            <p className="mt-4 text-[12px] leading-[1.6] text-slate-300">
              If your business needs functionality outside the standard YourPlan platform, we can scope and build it specifically for you.
            </p>
            <p className="mt-5 text-[12px] leading-[1.6] text-slate-300">
              Custom additions are quoted separately and only carried out with your approval.
            </p>
            <Link href="/contact" className="mt-8 inline-flex h-11 items-center justify-center gap-4 rounded bg-[#0d78ff] px-5 text-[12px] font-semibold shadow-[0_0_20px_rgba(22,141,255,.17)]">
              Book a Demo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <p className="mt-7 text-center text-[11px] text-slate-300">All prices are in AUD and include GST.</p>
      </section>
    </PageShell>
  );
}

function AboutPage() {
  const cards = [
    ["Our Mission", "To help businesses simplify how they work, save time and grow.", HelpCircle],
    ["Australian Support", "Local support from a team that understands your business.", Users],
    ["Secure & Reliable", "Your data is protected with enterprise-grade security and backups.", ShieldCheck],
    ["Always Improving", "We’re constantly listening and evolving based on customer feedback.", Settings],
  ] as const;
  return (
    <PageShell active="About">
      <section className="mx-auto w-full max-w-[1180px] flex-1 px-5 pb-8 pt-3 sm:px-7 lg:px-8 lg:pt-2">
        <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <div className="max-w-[450px]">
            <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#168dff]">About</p>
            <h1 className="mt-3 text-[31px] font-semibold leading-[1.08] tracking-[-.035em] lg:text-[30px]">
              Built for businesses.<br />Backed by people<br className="hidden lg:block" /> who care.
            </h1>
            <p className="mt-4 text-[12px] leading-[1.55] text-slate-300">
              YourPlan was created to help businesses escape the chaos of managing multiple systems and scattered information.
            </p>
            <p className="mt-3 text-[12px] leading-[1.55] text-slate-300">
              We believe software should work for you, not the other way around.
            </p>
          </div>
          <div className="relative min-h-[190px] overflow-hidden rounded-lg border border-white/[.08] bg-[#0b1720] sm:min-h-[250px] lg:min-h-[235px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "linear-gradient(180deg,rgba(2,8,13,.05),rgba(2,8,13,.28)),url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=82')" }}
            />
            <div className="absolute right-8 top-8 text-[27px] font-medium tracking-[-.07em] drop-shadow-lg"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-white/[.09] bg-[#07131d] p-4 lg:min-h-[110px]">
              <Icon size={20} className="text-[#168dff]" strokeWidth={1.7} />
              <h2 className="mt-3 text-[12px] font-semibold">{title}</h2>
              <p className="mt-1 text-[10px] leading-[1.45] text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function IndustriesPage() {
  const industries = [
    ["Electrical", "Designed for electrical businesses of all sizes.", Zap],
    ["Landscaping", "Manage jobs, schedules and teams in the field.", Leaf],
    ["Mechanical & Automotive", "Keep your workshop organised and efficient.", Settings],
    ["Construction", "Streamline projects and site operations.", Building2],
    ["Plumbing", "Manage jobs, quotes and compliance.", Wrench],
    ["Trade Services", "Built for trades and service businesses.", Hammer],
    ["Professional Services", "Manage clients, projects and communication.", Users],
    ["Service Businesses", "Flexible for any service based business.", Sparkles],
  ] as const;
  return (
    <PageShell active="Industries">
      <section className="mx-auto grid w-full max-w-[1180px] flex-1 gap-8 px-5 pb-8 pt-4 sm:px-7 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:px-8 lg:pt-0">
        <div className="lg:self-start lg:pt-12">
          <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#168dff]">Industries</p>
          <h1 className="mt-3 text-[31px] font-semibold leading-[1.08] tracking-[-.04em] lg:text-[30px]">
            One platform.<br />Different businesses.
          </h1>
          <p className="mt-4 max-w-[360px] text-[12px] leading-[1.55] text-slate-300">
            YourPlan isn’t built around one industry. It’s built around your business.
          </p>
          <p className="mt-8 hidden text-[11px] leading-[1.5] text-slate-400 lg:block">YourPlan adapts to your business, not the other way around.</p>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {industries.map(([name, text, Icon]) => (
              <div key={name} className="flex min-h-[130px] flex-col items-center justify-center rounded-lg border border-white/[.10] bg-[#07131d] px-3 py-4 text-center lg:min-h-[138px]">
                <Icon size={29} className="text-[#168dff]" strokeWidth={1.45} />
                <h2 className="mt-3 text-[12px] font-medium leading-[1.2]">{name}</h2>
                <p className="mt-2 hidden text-[9px] leading-[1.4] text-slate-400 lg:block">{text}</p>
              </div>
            ))}
            <div className="col-span-2 flex min-h-[86px] items-center justify-center gap-3 rounded-lg border border-white/[.10] bg-[#07131d] text-[12px] lg:hidden">
              <CircleEllipsis size={24} className="text-[#168dff]" /> And more
            </div>
          </div>
          <p className="mt-6 text-[13px] leading-[1.55] text-slate-300 lg:hidden">YourPlan adapts to your business, not the other way around.</p>
          <Link href="/contact" className="mx-auto mt-4 hidden h-10 w-fit items-center gap-4 rounded bg-[#0d78ff] px-5 text-[11px] font-semibold lg:flex">
            Book a Demo <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function ResourcesPage() {
  const cards = [
    ["Getting Started Guide", "Everything you need to know to get started with YourPlan.", "Guide", BookOpen],
    ["Best Practices", "Tips to streamline your business and save time.", "Article", CheckCircle2],
    ["Product Updates", "Stay up to date with the latest features and improvements.", "Update", Bell],
    ["Templates", "Documents and checklists to help you get organised.", "Template", FileText],
  ] as const;
  const topics = ["Jobs & Scheduling", "Quotes & Invoices", "Timesheets", "Staff & Permissions", "Documents", "Integrations"];
  return (
    <PageShell active="Resources">
      <section className="mx-auto w-full max-w-[1180px] flex-1 px-5 pb-8 pt-4 sm:px-7 lg:px-8 lg:pt-6">
        <div className="grid gap-7 lg:grid-cols-[.65fr_1.35fr] lg:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#168dff]">Resources</p>
            <h1 className="mt-3 text-[31px] font-semibold leading-[1.08] tracking-[-.035em] lg:text-[29px]">Helpful resources to<br />run a better business.</h1>
            <p className="mt-4 max-w-[330px] text-[12px] leading-[1.55] text-slate-300">Guides, tips and updates to help you get the most out of YourPlan.</p>
            <Link href="/contact" className="mt-7 hidden h-10 w-fit items-center gap-4 rounded bg-[#0d78ff] px-5 text-[11px] font-semibold lg:flex">Visit Help Centre <ArrowRight size={14} /></Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
            {cards.map(([title, text, meta, Icon]) => (
              <Link key={title} href="/contact" className="group flex min-h-[118px] items-start gap-4 rounded-lg border border-white/[.10] bg-[#07131d] p-4 sm:block lg:min-h-[220px] lg:p-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#168dff]/20 bg-[#06233b] text-[#168dff]"><Icon size={17} /></div>
                <div className="min-w-0 flex-1 lg:mt-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[12px] font-medium">{title}</h2>
                    <ChevronRight size={15} className="text-slate-300 lg:hidden" />
                  </div>
                  <p className="mt-2 text-[10px] leading-[1.45] text-slate-400">{text}</p>
                  <p className="mt-5 hidden text-[9px] text-slate-500 lg:block">{meta}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <p className="text-[10px] font-semibold text-[#168dff]">POPULAR TOPICS</p>
          <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-white/[.09] bg-[#06111a] p-3 lg:p-4">
            {topics.map((topic) => <span key={topic} className="rounded-full border border-white/[.10] bg-[#0a1721] px-4 py-2 text-[9px] text-slate-200">{topic}</span>)}
          </div>
          <Link href="/contact" className="mt-5 flex h-11 w-full items-center justify-center gap-4 rounded bg-[#0d78ff] text-[11px] font-semibold lg:hidden">Visit Help Centre <ArrowRight size={14} /></Link>
        </div>
      </section>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell active="Contact">
      <section className="mx-auto grid w-full max-w-[1080px] flex-1 gap-8 px-5 pb-8 pt-4 sm:px-7 lg:grid-cols-[.72fr_1.28fr] lg:items-start lg:px-8 lg:pt-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#168dff]">Contact</p>
          <h1 className="mt-3 text-[31px] font-semibold leading-[1.02] tracking-[-.035em] lg:text-[29px]">Let’s build something<br />great together.</h1>
          <p className="mt-4 max-w-[330px] text-[12px] leading-[1.55] text-slate-300">Have a question or want to see YourPlan in action? Get in touch with our team.</p>
          <div className="mt-6 hidden space-y-4 lg:block"><ContactDetails /></div>
        </div>
        <div>
          <form action="mailto:hello@your-plan.com.au" method="post" encType="text/plain" className="grid gap-2 sm:grid-cols-2">
            <input name="Full Name" placeholder="Full Name" className="h-11 rounded border border-white/[.10] bg-[#07131d] px-3 text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
            <input name="Business Name" placeholder="Business Name" className="h-11 rounded border border-white/[.10] bg-[#07131d] px-3 text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
            <input name="Email" type="email" placeholder="Email Address" className="h-11 rounded border border-white/[.10] bg-[#07131d] px-3 text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
            <input name="Phone" placeholder="Phone Number" className="h-11 rounded border border-white/[.10] bg-[#07131d] px-3 text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
            <textarea name="Message" placeholder="How can we help?" className="min-h-[120px] resize-none rounded border border-white/[.10] bg-[#07131d] p-3 text-[11px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50 sm:col-span-2" />
            <button type="submit" className="mt-1 inline-flex h-11 items-center justify-center gap-4 rounded bg-[#0d78ff] text-[11px] font-semibold sm:col-span-2 sm:w-[190px]">Send Message <ArrowRight size={14} /></button>
          </form>
          <div className="mt-6 space-y-4 lg:hidden"><ContactDetails /></div>
        </div>
      </section>
    </PageShell>
  );
}

function ContactDetails() {
  return (
    <>
      <div className="flex items-start gap-3"><Mail size={18} className="mt-0.5 text-[#168dff]" /><div><p className="text-[10px] font-medium text-[#168dff]">Email</p><a href="mailto:hello@your-plan.com.au" className="text-[10px] text-slate-300">hello@your-plan.com.au</a></div></div>
      <div className="flex items-start gap-3"><Phone size={18} className="mt-0.5 text-[#168dff]" /><div><p className="text-[10px] font-medium text-[#168dff]">Phone</p><a href="tel:1300123456" className="text-[10px] text-slate-300">1300 123 456</a></div></div>
      <div className="flex items-start gap-3"><Clock size={18} className="mt-0.5 text-[#168dff]" /><div><p className="text-[10px] font-medium text-[#168dff]">Hours</p><p className="text-[10px] text-slate-300">Mon - Fri: 8:30am - 5:00pm AEST</p></div></div>
    </>
  );
}

export function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative mx-auto ${compact ? "mt-5 max-w-[500px]" : "mt-8 max-w-[840px]"}`}>
      <div className="pointer-events-none absolute -inset-3 rounded-[18px] bg-[#168dff]/20 blur-[30px]" />
      <div className="relative overflow-hidden rounded-[12px] border border-[#168dff]/45 bg-[#030b12] shadow-[0_20px_50px_rgba(0,0,0,.55)]">
        <div className="flex h-8 items-center justify-between border-b border-white/[.06] px-3">
          <span className="text-[9px] font-medium tracking-[-.06em]"><span className="text-[#168dff]">Your</span>plan</span>
          <span className="rounded-full border border-[#168dff] px-1.5 py-0.5 text-[7px] text-white">YP</span>
        </div>
        <div className="grid grid-cols-[32px_1fr]">
          <aside className="border-r border-white/[.06] bg-[#02070c] py-2">
            <div className="space-y-2.5">{[0,1,2,3,4,5,6,7].map((i) => <div key={i} className={`mx-auto h-[7px] w-[11px] rounded-sm ${i === 0 ? "bg-[#168dff]" : "bg-slate-700/70"}`} />)}</div>
          </aside>
          <div className="p-2">
            <div className="grid grid-cols-4 gap-1">
              {[["Total Jobs","42"],["Revenue","$124,580"],["Quotes Sent","37"],["Invoices Paid","28"]].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded border border-white/[.07] bg-[#07131d] p-1.5">
                  <p className="truncate text-[5.5px] text-slate-400">{label}</p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-white sm:text-[11px]">{value}</p>
                  <svg viewBox="0 0 80 14" className="mt-1 h-[9px] w-full"><polyline points="0,11 12,8 24,10 37,5 49,7 61,3 80,5" fill="none" stroke="#168dff" strokeWidth="1.2" /></svg>
                </div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-[.9fr_1.1fr] gap-1.5">
              <div className="rounded border border-white/[.07] bg-[#07131d] p-2">
                <p className="text-[6px] font-medium">Job Overview</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-[6px] border-[#168dff]"><div className="text-center"><div className="text-[12px] font-semibold">42</div><div className="text-[4.5px] text-slate-500">Total Jobs</div></div></div>
                  <div className="space-y-1 text-[5px] text-slate-400"><p>In Progress &nbsp; 18</p><p>Completed &nbsp; 16</p><p>Scheduled &nbsp; 6</p><p>Pending &nbsp; 2</p></div>
                </div>
              </div>
              <div className="rounded border border-white/[.07] bg-[#07131d] p-2">
                <div className="flex items-center justify-between"><p className="text-[6px] font-medium">Revenue Overview</p><span className="text-[5px] text-slate-400">$24,680</span></div>
                <div className="relative mt-2 h-[50px]">
                  <div className="absolute inset-x-0 bottom-2 h-px bg-white/[.05]" /><div className="absolute inset-x-0 bottom-6 h-px bg-white/[.05]" /><div className="absolute inset-x-0 bottom-10 h-px bg-white/[.05]" />
                  <svg viewBox="0 0 160 50" className="absolute inset-0 h-full w-full" preserveAspectRatio="none"><polyline points="0,43 18,37 36,39 55,28 73,31 91,20 109,25 128,12 145,16 160,8" fill="none" stroke="#168dff" strokeWidth="2" /></svg>
                </div>
              </div>
            </div>
            <div className="mt-1.5 grid grid-cols-[1.1fr_.9fr] gap-1.5">
              <div className="rounded border border-white/[.07] bg-[#07131d] p-2"><p className="text-[6px] font-medium">Upcoming Jobs</p><div className="mt-1.5 space-y-1 text-[5px] text-slate-400"><p>✦ Kitchen Renovation <span className="float-right text-[#168dff]">Today</span></p><p>◷ Bathroom Fitout <span className="float-right text-[#168dff]">Tomorrow</span></p></div></div>
              <div className="rounded border border-white/[.07] bg-[#07131d] p-2"><p className="text-[6px] font-medium">Recent Activity</p><div className="mt-1.5 space-y-1 text-[5px] text-slate-400"><p>Invoice paid <span className="float-right">2m</span></p><p>New quote sent <span className="float-right">15m</span></p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
