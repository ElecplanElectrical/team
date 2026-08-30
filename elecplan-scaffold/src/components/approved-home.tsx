import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Hammer,
  Leaf,
  Menu,
  Package,
  Settings,
  Users,
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

const strip = [
  ["Jobs", BriefcaseBusiness],
  ["Leads & CRM", Users],
  ["Quotes", FileText],
  ["Invoices", FileText],
  ["Calendar", CalendarDays],
  ["Staff", Users],
  ["Timesheets", CalendarDays],
  ["Documents", FileText],
  ["Stock", Package],
  ["Reminders", Bell],
  ["Reporting", BarChart3],
  ["AI & Automation", Bot],
] as const;

const industries = [
  ["Electrical", Zap],
  ["Landscaping", Leaf],
  ["Mechanical", Settings],
  ["Trades", Hammer],
  ["Service Businesses", Wrench],
] as const;

function Wordmark({ size = "normal" }: { size?: "normal" | "small" }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline [font-family:Sora,Inter,sans-serif] font-medium tracking-[-.075em] ${size === "small" ? "text-[19px]" : "text-[25px] lg:text-[30px]"}`}
      aria-label="YourPlan home"
    >
      <span className="text-[#168dff]">Your</span><span className="text-white">plan</span>
    </Link>
  );
}

function Header() {
  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-[72px] w-full max-w-[1450px] items-center justify-between px-5 sm:px-7 lg:h-[84px] lg:px-10">
        <Wordmark />
        <nav className="hidden items-center gap-9 lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="text-[13px] font-medium text-slate-200 transition hover:text-white">{label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-lg border border-white/35 bg-black/10 px-5 py-3 text-[13px] font-medium text-white">Login</Link>
          <Link href="/contact" className="rounded-lg bg-[#0d78ff] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_0_22px_rgba(22,141,255,.22)]">Book a Demo</Link>
        </div>
        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center p-2 marker:hidden"><Menu size={26} /></summary>
          <div className="absolute right-0 top-11 w-48 rounded-xl border border-white/10 bg-[#071019] p-2 shadow-2xl">
            {nav.map(([label, href]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">{label}</Link>)}
            <Link href="/login" className="mt-1 block rounded-lg border border-white/10 px-3 py-2 text-sm text-white">Login</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

export default function ApprovedHomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#02080d] text-white [font-family:Inter,sans-serif]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_26%_18%,rgba(145,151,157,.26),transparent_24%),radial-gradient(circle_at_64%_46%,rgba(22,141,255,.13),transparent_29%),linear-gradient(115deg,#313438_0%,#171b1e_30%,#070d12_60%,#02080d_100%)]">
        <Header />
        <div className="relative mx-auto grid w-full max-w-[1450px] gap-8 px-5 pb-7 pt-7 sm:px-7 lg:grid-cols-[.47fr_.53fr] lg:items-center lg:px-10 lg:pb-12 lg:pt-10">
          <div className="relative z-10">
            <h1 className="text-[42px] font-black uppercase leading-[1.02] tracking-[-.055em] sm:text-[58px] lg:text-[66px] xl:text-[70px]">
              <span className="text-[#168dff]">YOUR</span> BUSINESS.<br />
              <span className="text-[#168dff]">YOUR</span> WAY.<br />
              <span className="text-[#168dff]">YOUR</span> PLAN.
            </h1>
            <p className="mt-5 max-w-[500px] text-[15px] leading-[1.55] text-slate-200 lg:text-[17px]">
              All-in-one business management software built for trade and service businesses.<br className="hidden lg:block" /> Manage, automate, and grow—on your terms.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:w-fit sm:flex-row">
              <Link href="/contact" className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[#0d78ff] px-6 text-[15px] font-semibold shadow-[0_0_28px_rgba(22,141,255,.28)]"><ArrowRight size={18} /> Book a Demo</Link>
              <Link href="/features" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 bg-black/15 px-6 text-[15px] font-semibold">See Features</Link>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/15 px-4 py-2 text-[10px] font-medium uppercase tracking-[.12em] text-slate-300">
              Powered by <span className="normal-case tracking-[-.05em]"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[720px] lg:mx-0 lg:justify-self-end">
            <div className="pointer-events-none absolute inset-[7%] rounded-[22px] bg-[#168dff]/22 blur-[52px]" />
            <Dashboard />
          </div>
        </div>
      </section>

      <ModuleStrip />

      <section className="mx-auto grid w-full max-w-[1450px] gap-4 px-5 py-4 sm:px-7 lg:grid-cols-[.46fr_.54fr] lg:px-10 lg:py-5">
        <PricingCard />
        <IndustriesCard />
      </section>

      <DesktopFooter />
    </main>
  );
}

function ModuleStrip() {
  return (
    <section className="border-y border-white/[.10] bg-[#071017]">
      <div className="mx-auto grid max-w-[1450px] grid-cols-4 px-2 sm:grid-cols-6 lg:grid-cols-12 lg:px-10">
        {strip.map(([label, Icon]) => (
          <Link key={label} href="/features" className="flex min-h-[82px] flex-col items-center justify-center gap-2 px-1 text-center text-[10px] text-slate-200 transition hover:bg-white/[.025] lg:min-h-[88px] lg:text-[11px]">
            <Icon size={22} strokeWidth={1.55} className="text-[#168dff]" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PricingCard() {
  return (
    <div className="rounded-xl border border-white/[.13] bg-[#071018] p-5 sm:p-6 lg:min-h-[155px]">
      <div className="grid gap-5 sm:grid-cols-[.9fr_1.1fr] sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#168dff]">Simple, transparent pricing</p>
          <div className="mt-3 flex items-end gap-2"><span className="text-[64px] font-semibold leading-none tracking-[-.055em] text-[#168dff]">$50</span><span className="pb-1 text-sm text-white">/ month</span></div>
        </div>
        <div className="border-white/[.08] sm:border-l sm:pl-6">
          {["No joining fee", "Free trial on request", "Cancel anytime", "Custom add-ons quoted separately"].map((item) => (
            <p key={item} className="mt-2 flex items-center gap-2 text-[11px] text-slate-300 first:mt-0"><span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#168dff] text-[9px] text-[#168dff]">✓</span>{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function IndustriesCard() {
  return (
    <div className="rounded-xl border border-white/[.13] bg-[#071018] p-5 sm:p-6 lg:min-h-[155px]">
      <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#168dff]">Built for your industry</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {industries.map(([label, Icon]) => (
          <Link href="/industries" key={label} className="flex min-h-[72px] flex-col items-center justify-center gap-2 border-white/[.08] text-center text-[10px] text-slate-200 sm:border-r sm:last:border-r-0">
            <Icon size={25} strokeWidth={1.45} className="text-slate-200" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-400">YourPlan adapts to your business, not the other way around.</p>
    </div>
  );
}

function DesktopFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1450px] px-5 pb-5 sm:px-7 lg:px-10">
      <div className="hidden rounded-xl border border-white/[.11] bg-[#061017] p-6 lg:grid lg:grid-cols-[1.25fr_.65fr_.65fr_.8fr_1.2fr] lg:gap-8">
        <div>
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#168dff] text-[22px] font-medium"><span className="text-[#168dff]">Y</span>P</div><div><p className="text-[9px] uppercase tracking-[.08em] text-slate-300">Powered by</p><Wordmark size="small" /></div></div>
          <p className="mt-5 text-[11px] text-slate-300">One platform. Built for your business.</p>
        </div>
        <FooterColumn title="Product" links={["Features","Pricing","Integrations","Changelog"]} />
        <FooterColumn title="Company" links={["About Us","Careers","Partners","Contact Us"]} />
        <FooterColumn title="Resources" links={["Help Centre","Community","Blog","Guides"]} />
        <div className="rounded-lg border border-white/[.08] bg-[#07131b] p-5"><p className="text-[16px] font-medium">Ready to transform your business?</p><p className="mt-1 text-[11px] text-slate-400">Book a demo today and see the difference.</p><Link href="/contact" className="mt-4 inline-flex h-10 items-center gap-5 rounded bg-[#0d78ff] px-5 text-[11px] font-semibold">Book a Demo <ArrowRight size={14} /></Link></div>
      </div>
      <div className="flex items-center justify-between py-6 text-[10px] text-slate-500"><span>© 2025 YourPlan. All rights reserved.</span><div className="hidden items-center gap-8 sm:flex"><span>Privacy Policy</span><span>Terms of Service</span><span className="text-white">f</span><span className="text-white">in</span><span className="text-white">▶</span></div></div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return <div><p className="text-[10px] font-semibold uppercase text-slate-300">{title}</p><div className="mt-3 space-y-2">{links.map((link) => <p key={link} className="text-[10px] text-slate-400">{link}</p>)}</div></div>;
}

function Dashboard() {
  const metrics = [["Total Jobs","42"],["Revenue","$124,580"],["Quotes Sent","37"],["Invoices Paid","28"]];
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#168dff]/55 bg-[#03090e] shadow-[0_22px_60px_rgba(0,0,0,.62)]">
      <div className="grid grid-cols-[92px_1fr] sm:grid-cols-[120px_1fr]">
        <aside className="border-r border-white/[.07] bg-[#04090e] p-3 sm:p-4">
          <div className="mb-4 text-[12px] font-medium tracking-[-.05em]"><span className="text-[#168dff]">Your</span>plan</div>
          {['Dashboard','Jobs','Leads & CRM','Quotes','Invoices','Calendar','Staff','Timesheets','Documents','Stock','Reminders','Reporting','AI & Automation'].map((item,index)=><div key={item} className={`mb-1.5 flex items-center gap-2 rounded px-2 py-1.5 text-[6px] sm:text-[8px] ${index===0?'bg-[#082847] text-white':'text-slate-400'}`}><span className={`h-2 w-2 rounded-sm border ${index===0?'border-[#168dff]':'border-slate-500'}`} />{item}</div>)}
        </aside>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between"><p className="text-[9px] font-semibold sm:text-[12px]">Dashboard</p><div className="rounded border border-white/[.08] px-2 py-1 text-[5px] text-slate-400 sm:text-[7px]">May 12 – May 18, 2025</div></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map(([label,value])=><div key={label} className="rounded border border-white/[.07] bg-[#07131a] p-2 sm:p-3"><p className="text-[5px] text-slate-400 sm:text-[7px]">{label}</p><p className="mt-1 text-[11px] font-medium sm:text-[17px]">{value}</p><svg viewBox="0 0 80 14" className="mt-1 h-[8px] w-full"><polyline points="0,11 12,8 24,10 37,5 49,7 61,3 80,5" fill="none" stroke="#168dff" strokeWidth="1.2" /></svg></div>)}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[.72fr_1.28fr]">
            <div className="rounded border border-white/[.07] bg-[#07131a] p-2 sm:p-3"><p className="text-[6px] font-medium sm:text-[8px]">Job Overview</p><div className="mt-2 flex items-center justify-center gap-3"><div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-[7px] border-[#168dff] sm:h-[76px] sm:w-[76px]"><div className="text-center"><p className="text-[13px] font-medium sm:text-[18px]">42</p><p className="text-[4px] text-slate-500 sm:text-[6px]">Total Jobs</p></div></div><div className="hidden space-y-1 text-[6px] text-slate-400 sm:block"><p>In Progress &nbsp;18</p><p>Completed &nbsp;16</p><p>Scheduled &nbsp;6</p><p>Pending &nbsp;2</p></div></div></div>
            <div className="rounded border border-white/[.07] bg-[#07131a] p-2 sm:p-3"><div className="flex justify-between"><p className="text-[6px] font-medium sm:text-[8px]">Revenue Overview</p><span className="text-[5px] text-slate-400 sm:text-[6px]">$24,680</span></div><div className="relative mt-2 h-[62px] sm:h-[96px]"><div className="absolute inset-x-0 bottom-3 h-px bg-white/[.05]"/><div className="absolute inset-x-0 bottom-8 h-px bg-white/[.05]"/><div className="absolute inset-x-0 bottom-14 h-px bg-white/[.05]"/><svg viewBox="0 0 300 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="none"><polygon points="0,78 35,65 70,70 105,49 140,58 175,37 210,47 245,22 300,29 300,90 0,90" fill="rgba(22,141,255,.12)"/><polyline points="0,78 35,65 70,70 105,49 140,58 175,37 210,47 245,22 300,29" fill="none" stroke="#168dff" strokeWidth="2.2"/></svg></div></div>
          </div>
          <div className="mt-2 grid grid-cols-[1.1fr_.9fr] gap-2"><div className="rounded border border-white/[.07] bg-[#07131a] p-2 sm:p-3"><p className="text-[6px] font-medium sm:text-[8px]">Upcoming Jobs</p><div className="mt-2 space-y-2 text-[5px] text-slate-400 sm:text-[7px]"><p>✦ Kitchen Renovation <span className="float-right rounded bg-[#08305a] px-1.5 py-0.5 text-[#168dff]">Today</span></p><p>◷ Bathroom Fitout <span className="float-right rounded bg-[#08305a] px-1.5 py-0.5 text-[#168dff]">Tomorrow</span></p></div></div><div className="rounded border border-white/[.07] bg-[#07131a] p-2 sm:p-3"><p className="text-[6px] font-medium sm:text-[8px]">Recent Activity</p><div className="mt-2 space-y-1.5 text-[5px] text-slate-400 sm:text-[7px]"><p>Invoice paid <span className="float-right">2m</span></p><p>New quote sent <span className="float-right">15m</span></p><p>Job updated <span className="float-right">32m</span></p></div></div></div>
        </div>
      </div>
    </div>
  );
}
