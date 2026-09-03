import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
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
  type LucideIcon,
} from "lucide-react";

const nav = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
] as const;

const features: Array<[string, string, LucideIcon]> = [
  ["Jobs", "Manage work from creation through to completion.", BriefcaseBusiness],
  ["Scheduling", "See what’s happening, who’s doing it and when.", CalendarDays],
  ["Clients & Leads", "Keep customer information, opportunities and communication organised.", Users],
  ["Quotes & Invoices", "Create, manage and track your business documents.", WalletCards],
  ["Staff & Timesheets", "Manage your team, access and working hours.", Users],
  ["Documents", "Store important business and job files where your team can access them.", FileText],
  ["Stock & Materials", "Keep track of stock, materials and what you need.", Package],
  ["Reminders", "Keep follow-ups, tasks and important deadlines in view.", Bell],
  ["Reporting", "See what’s happening across your business at a glance.", BarChart3],
  ["AI & Automation", "Reduce repetitive admin and automate the boring stuff.", Bot],
];

const industries: Array<[string, string, LucideIcon]> = [
  ["Electrical", "Jobs, scheduling, quoting, compliance, staff and materials in one place.", Zap],
  ["Landscaping", "Plan crews, projects, materials, client communication and recurring work.", Leaf],
  ["Mechanical", "Manage workshop jobs, vehicles, parts, inspections and customer updates.", Settings],
  ["Trades", "A flexible operating system for trade businesses that need less admin.", Hammer],
  ["Service Businesses", "Run bookings, customers, staff, documents, billing and follow-ups together.", Wrench],
];

const resources: Array<[string, string, LucideIcon]> = [
  ["Help Centre", "Straightforward answers for using YourPlan day to day.", HelpCircle],
  ["Guides", "Practical guides for getting more from your business platform.", FileText],
  ["Community", "Ideas, product feedback and shared ways of working smarter.", Users],
  ["Product Updates", "See improvements and new capabilities as YourPlan evolves.", Sparkles],
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="YourPlan home" className="inline-flex items-center">
      <img
        src="/yourplan-wordmark.webp"
        alt="YourPlan"
        className={`block object-contain mix-blend-screen ${compact ? "h-[25px] w-[112px]" : "h-[34px] w-[154px] sm:h-[38px] sm:w-[172px]"}`}
      />
    </Link>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return <Logo compact={compact} />;
}

function Header({ active }: { active?: string }) {
  return (
    <header className="relative z-40 border-b border-white/[.05] bg-[#070b0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-[94%] max-w-[1360px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={`text-[13px] transition ${active === label ? "text-white" : "text-slate-300 hover:text-white"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-[7px] border border-white/30 px-5 py-2.5 text-[13px]">Login</Link>
          <Link href="/contact" className="rounded-[7px] bg-[#0b86ff] px-6 py-2.5 text-[13px] shadow-[0_0_20px_rgba(22,141,255,.25)]">Book a Demo</Link>
        </div>
        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-[7px] border border-white/25 bg-black/20 marker:hidden" aria-label="Open menu">
            <Menu size={24} />
          </summary>
          <div className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-white/15 bg-[#080e14] p-2 shadow-2xl">
            {nav.map(([label, href]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5">{label}</Link>)}
            <Link href="/login" className="mt-1 block rounded-lg border border-white/15 px-3 py-2.5 text-sm">Login</Link>
            <Link href="/contact" className="mt-2 block rounded-lg bg-[#0b86ff] px-3 py-2.5 text-center text-sm">Book a Demo</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function Texture() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,#383d42_0%,#282d32_20%,#171c21_47%,#0b1015_72%,#05090d_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(17deg,rgba(255,255,255,.022)_0px,rgba(255,255,255,.022)_1px,transparent_1px,transparent_5px),repeating-linear-gradient(103deg,rgba(0,0,0,.12)_0px,rgba(0,0,0,.12)_2px,transparent_2px,transparent_8px)]" />
      <div className="pointer-events-none absolute right-[-12%] top-[10%] h-[360px] w-[480px] rounded-full bg-[#168dff]/10 blur-[85px]" />
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-5 pb-5">
      <section className="mx-auto w-[94%] max-w-[1360px] rounded-[10px] border border-white/15 bg-[#0a1015] p-5 sm:p-7 lg:grid lg:grid-cols-[1.3fr_.7fr_.7fr_.8fr_1.4fr] lg:gap-8">
        <div>
          <img src="/yourplan-powered-footer.webp" alt="Powered by YourPlan" className="h-auto w-[250px] max-w-full object-contain mix-blend-screen" />
          <p className="mt-3 text-[12px] text-slate-400">One platform. Built for your business.</p>
        </div>
        <FooterCol title="PRODUCT" items={["Features", "Pricing", "Integrations", "Changelog"]} />
        <FooterCol title="COMPANY" items={["About Us", "Careers", "Partners", "Contact Us"]} />
        <FooterCol title="RESOURCES" items={["Help Centre", "Community", "Blog", "Guides"]} />
        <div className="mt-6 rounded-[8px] border border-white/10 bg-[#0c1218] p-4 lg:mt-0">
          <div className="text-[16px] font-medium">Ready to transform your business?</div>
          <p className="mt-1 text-[12px] text-slate-400">Book a demo today and see the difference.</p>
          <Link href="/contact" className="mt-4 inline-flex h-10 items-center gap-3 rounded-[6px] bg-[#0b84ff] px-5 text-[12px]">Book a Demo <ArrowRight size={15} /></Link>
        </div>
      </section>
      <section className="mx-auto flex w-[94%] max-w-[1360px] flex-col gap-3 px-2 pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2025 YourPlan. All rights reserved.</span>
        <div className="flex items-center gap-5"><span>Privacy Policy</span><span>Terms of Service</span><span className="text-white">f</span><span className="text-white">in</span><span className="text-white">▶</span></div>
      </section>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 text-[11px] text-slate-400 lg:mt-1">
      <div className="mb-3 font-semibold text-white">{title}</div>
      <div className="space-y-2">{items.map((x) => <div key={x}>{x}</div>)}</div>
    </div>
  );
}

function PageShell({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04090e] text-white [font-family:Inter,Arial,sans-serif]">
      <Header active={active} />
      {children}
      <Footer />
    </main>
  );
}

function Hero({ eyebrow, title, blue, body, children }: { eyebrow: string; title: string; blue?: string; body: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[.06]">
      <Texture />
      <div className="relative z-10 mx-auto w-[92%] max-w-[1360px] py-12 sm:py-16 lg:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-[#168dff]">{eyebrow}</p>
        <h1 className="mt-4 max-w-[920px] text-[40px] font-black leading-[1.02] tracking-[-.045em] sm:text-[52px] lg:text-[66px]">
          {title}{blue ? <><br /><span className="text-[#168dff]">{blue}</span></> : null}
        </h1>
        <p className="mt-5 max-w-[720px] text-[15px] leading-[1.65] text-slate-200 sm:text-[17px]">{body}</p>
        {children}
      </div>
    </section>
  );
}

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-[94%] max-w-[1360px] py-5 sm:py-7 ${className}`}>{children}</section>;
}

function PremiumCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[10px] border border-white/15 bg-[linear-gradient(145deg,#0d141a,#080e13)] p-5 shadow-[0_12px_30px_rgba(0,0,0,.2)] transition hover:border-[#168dff]/45 hover:shadow-[0_0_28px_rgba(22,141,255,.1)] sm:p-6">
      <div className="absolute right-[-40px] top-[-45px] h-32 w-32 rounded-full bg-[#168dff]/[.06] blur-2xl" />
      <div className="relative flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[#168dff]/30 bg-[#08213a] text-[#168dff] shadow-[0_0_16px_rgba(22,141,255,.08)]"><Icon size={21} strokeWidth={1.7} /></div>
        <div><h2 className="text-[16px] font-semibold sm:text-[17px]">{title}</h2><p className="mt-1.5 text-[13px] leading-[1.55] text-slate-400 sm:text-[14px]">{text}</p></div>
      </div>
    </div>
  );
}

function FeaturePage() {
  return (
    <PageShell active="Features">
      <Hero eyebrow="Features" title="Everything your business needs." blue="One place." body="Running a business shouldn’t mean jumping between five different systems. YourPlan brings the everyday parts of your business together in one platform.">
        <div className="mt-6 flex flex-wrap gap-3"><Primary href="/contact">Book a Demo</Primary><Secondary href="/pricing">See Pricing</Secondary></div>
      </Hero>
      <Section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title, text, icon]) => <PremiumCard key={title} title={title} text={text} icon={icon} />)}</div>
      </Section>
      <BrandBand />
    </PageShell>
  );
}

function IndustriesPage() {
  return (
    <PageShell active="Industries">
      <Hero eyebrow="Industries" title="Built around the way" blue="your business works." body="YourPlan keeps one strong platform underneath, then adapts modules, workflows and branding to suit different businesses and industries." />
      <Section><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{industries.map(([title, text, icon]) => <PremiumCard key={title} title={title} text={text} icon={icon} />)}</div></Section>
      <BrandBand />
    </PageShell>
  );
}

function PricingPage() {
  const bullets = ["No joining fee", "Free trial on request", "Cancel anytime", "Custom add-ons quoted separately", "Standard platform updates included"];
  return (
    <PageShell active="Pricing">
      <Hero eyebrow="Simple, transparent pricing" title="One platform." blue="$50 / month." body="A straightforward starting point for businesses that want the essentials together without paying for a pile of disconnected systems." />
      <Section>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[10px] border border-[#168dff]/30 bg-[linear-gradient(145deg,#101820,#080d12)] p-6 shadow-[0_0_32px_rgba(22,141,255,.09)] sm:p-8">
            <div className="text-[12px] uppercase tracking-[.12em] text-[#168dff]">YourPlan subscription</div>
            <div className="mt-4 text-[64px] font-semibold leading-none text-[#168dff] sm:text-[82px]">$50 <span className="text-[18px] font-normal text-white">/ month</span></div>
            <div className="mt-7 space-y-3">{bullets.map((x) => <div key={x} className="flex items-center gap-3 text-[14px]"><CheckCircle2 size={18} className="text-[#168dff]" />{x}</div>)}</div>
            <Primary href="/contact" extra="mt-7">Book a Demo</Primary>
          </div>
          <div className="rounded-[10px] border border-white/15 bg-[#0a1015] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[.12em] text-[#168dff]">Designed to scale</p>
            <h2 className="mt-3 text-[26px] font-bold tracking-[-.03em]">Start clean. Add what you need.</h2>
            <p className="mt-4 text-[14px] leading-6 text-slate-400">Your standard portal includes the core YourPlan platform, your branding and selected modules. More specialised workflows, integrations and custom additions can be quoted separately.</p>
            <div className="mt-6 rounded-[8px] border border-white/10 bg-[#0d141a] p-4 text-[13px] text-slate-300">YourPlan adapts to your business, not the other way around.</div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

function AboutPage() {
  const pillars: Array<[string, string, LucideIcon]> = [
    ["One platform", "Bring everyday operations into one connected place.", Building2],
    ["Built your way", "Configure modules and workflows around how your team actually works.", Settings],
    ["Less admin", "Use automation and AI to remove repetitive work wherever it makes sense.", Sparkles],
    ["Made to grow", "Start with what you need now and expand as your business changes.", BarChart3],
  ];
  return (
    <PageShell active="About">
      <Hero eyebrow="About YourPlan" title="Your business." blue="Your way." body="YourPlan is business management software designed to give everyday businesses one central place to run their operation — without forcing every company into the same rigid workflow." />
      <Section><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pillars.map(([title, text, icon]) => <PremiumCard key={title} title={title} text={text} icon={icon} />)}</div></Section>
      <BrandBand />
    </PageShell>
  );
}

function ResourcesPage() {
  return (
    <PageShell active="Resources">
      <Hero eyebrow="Resources" title="Useful answers." blue="No unnecessary noise." body="Everything you need to understand the platform, set your team up properly and get more value from YourPlan." />
      <Section><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{resources.map(([title, text, icon]) => <PremiumCard key={title} title={title} text={text} icon={icon} />)}</div></Section>
      <BrandBand />
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell active="Contact">
      <Hero eyebrow="Contact" title="See how YourPlan can work" blue="for your business." body="Tell us how your business runs today, where the admin pain is and what you want in one place. We’ll show you how YourPlan can fit around it." />
      <Section>
        <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
          <div className="space-y-3">
            <PremiumCard icon={Mail} title="Email" text="Talk to the YourPlan team about your setup and requirements." />
            <PremiumCard icon={Phone} title="Book a demo" text="Walk through the platform and see how it can be configured for your business." />
            <PremiumCard icon={ShieldCheck} title="Tailored onboarding" text="We’ll help map the right modules and workflows before you launch." />
          </div>
          <div className="rounded-[10px] border border-[#168dff]/25 bg-[linear-gradient(145deg,#101820,#080d12)] p-6 shadow-[0_0_32px_rgba(22,141,255,.08)] sm:p-8">
            <p className="text-[11px] uppercase tracking-[.12em] text-[#168dff]">Book a demo</p>
            <h2 className="mt-3 text-[28px] font-bold tracking-[-.03em] sm:text-[34px]">Ready to transform your business?</h2>
            <p className="mt-4 max-w-[560px] text-[14px] leading-6 text-slate-400">Book a demo today and see the difference one properly connected platform can make.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] border border-white/10 bg-[#0b1117] p-4"><div className="text-[12px] text-slate-500">Starting from</div><div className="mt-1 text-[32px] font-semibold text-[#168dff]">$50<span className="text-[13px] font-normal text-white"> / month</span></div></div>
              <div className="rounded-[8px] border border-white/10 bg-[#0b1117] p-4"><div className="text-[12px] text-slate-500">Setup</div><div className="mt-1 text-[18px] font-semibold">No joining fee</div><div className="mt-1 text-[12px] text-slate-400">Custom add-ons quoted separately.</div></div>
            </div>
            <Primary href="mailto:hello@your-plan.com.au" extra="mt-6">Contact YourPlan</Primary>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

function BrandBand() {
  return (
    <Section className="pt-0">
      <div className="flex flex-col gap-5 rounded-[10px] border border-[#168dff]/25 bg-[linear-gradient(100deg,#0b1218,#08111a)] p-5 shadow-[0_0_26px_rgba(22,141,255,.07)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><div className="text-[20px] font-semibold">Ready to simplify your business?</div><div className="mt-1 text-[13px] text-slate-400">See how YourPlan can work for you.</div></div>
        <Primary href="/contact">Book a Demo</Primary>
      </div>
    </Section>
  );
}

function Primary({ href, children, extra = "" }: { href: string; children: ReactNode; extra?: string }) {
  return <Link href={href} className={`inline-flex h-12 items-center justify-center gap-3 rounded-[7px] bg-[#0b84ff] px-6 text-[13px] font-medium shadow-[0_0_20px_rgba(22,141,255,.22)] ${extra}`}>{children}<ArrowRight size={16} /></Link>;
}

function Secondary({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex h-12 items-center justify-center rounded-[7px] border border-white/35 bg-[#11171d]/70 px-6 text-[13px]">{children}</Link>;
}

export function InfoPage({ kind }: { kind: "features" | "pricing" | "about" | "industries" | "resources" | "contact" }) {
  if (kind === "features") return <FeaturePage />;
  if (kind === "pricing") return <PricingPage />;
  if (kind === "about") return <AboutPage />;
  if (kind === "industries") return <IndustriesPage />;
  if (kind === "resources") return <ResourcesPage />;
  return <ContactPage />;
}

// Kept for compatibility with older imports. The live root page uses the locked homepage components.
export function HomePage() {
  return <FeaturePage />;
}
