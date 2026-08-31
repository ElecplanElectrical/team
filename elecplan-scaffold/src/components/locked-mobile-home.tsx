import Link from "next/link";
import {
  Bell,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Hammer,
  Leaf,
  Menu,
  Package,
  Settings,
  Users,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";

const blue = "#168dff";

const modules = [
  ["Jobs", BriefcaseBusiness],
  ["Leads & CRM", Users],
  ["Quotes", FileText],
  ["Invoices", WalletCards],
  ["Calendar", CalendarDays],
  ["Staff", Users],
  ["Timesheets", CalendarDays],
  ["Documents", FileText],
  ["Stock", Package],
  ["Reminders", Bell],
  ["Reporting", BarChart3],
  ["AI & Automation", Settings],
] as const;

const industries = [
  ["Electrical", Zap],
  ["Landscaping", Leaf],
  ["Mechanical", Settings],
  ["Trades", Hammer],
  ["Service Businesses", Wrench],
] as const;

function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-label="YourPlan"
      role="img"
      className={`block shrink-0 ${small ? "h-[21px] w-[96px]" : "h-[34px] w-[150px]"}`}
      style={{
        backgroundImage: "url('/api/approved-home')",
        backgroundRepeat: "no-repeat",
        backgroundSize: small ? "740px 555px" : "1155px 866px",
        backgroundPosition: small ? "-20px -11px" : "-30px -16px",
      }}
    />
  );
}

function MiniLine() {
  return (
    <svg viewBox="0 0 100 20" className="h-3 w-full" aria-hidden="true">
      <polyline points="0,16 16,13 31,15 48,9 64,11 80,5 100,7" fill="none" stroke={blue} strokeWidth="2" />
    </svg>
  );
}

function DashboardCard() {
  return (
    <div className="relative mt-8 h-[252px] w-[108%] -translate-x-[2%] [perspective:1000px] sm:h-[322px]">
      <div className="absolute inset-0 origin-center [transform:rotateY(-7deg)_rotateX(2deg)_rotateZ(-1deg)]">
        <div className="flex h-full overflow-hidden rounded-[14px] border border-[#168dff]/35 bg-[#080d12] shadow-[0_0_26px_rgba(22,141,255,.42),0_22px_55px_rgba(0,0,0,.55)]">
          <aside className="w-[18.7%] border-r border-white/[.07] bg-[#070b0f] px-2 py-2.5">
            <BrandLogo small />
            <div className="mt-3 space-y-[3px] text-[5px] leading-none text-slate-400 sm:text-[6px]">
              {["Dashboard", "Jobs", "Leads & CRM", "Quotes", "Invoices", "Calendar", "Staff", "Timesheets", "Documents", "Stock", "Reminders", "Reporting", "AI & Automation"].map((item, index) => (
                <div key={item} className={`flex h-[11px] items-center rounded px-1 ${index === 0 ? "bg-[#0b3763] text-white" : ""}`}>{item}</div>
              ))}
            </div>
          </aside>

          <section className="flex-1 px-2.5 py-2.5 sm:px-3 sm:py-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold sm:text-[11px]">Dashboard</span>
              <span className="text-[4.5px] text-slate-500 sm:text-[5.5px]">May 12 – May 18, 2025</span>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {[["Total Jobs", "42"], ["Revenue", "$124,580"], ["Quotes Sent", "37"], ["Invoices Paid", "28"]].map(([label, value]) => (
                <div key={label} className="h-[47px] rounded border border-white/[.08] bg-[#0b1015] p-1.5 sm:h-[61px] sm:p-2">
                  <div className="truncate text-[4.5px] text-slate-400 sm:text-[5.5px]">{label}</div>
                  <div className="mt-0.5 truncate text-[8px] font-semibold sm:text-[10px]">{value}</div>
                  <div className="mt-1"><MiniLine /></div>
                </div>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-[.92fr_1.45fr] gap-1.5">
              <div className="h-[73px] rounded border border-white/[.08] bg-[#0b1015] p-1.5 sm:h-[94px] sm:p-2">
                <div className="text-[5px] sm:text-[6px]">Job Overview</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[5px] border-[#168dff] border-r-[#1b2631] border-b-[#1b2631] text-[7px] sm:h-12 sm:w-12 sm:border-[6px] sm:text-[9px]">42</div>
                  <div className="text-[4px] leading-[1.65] text-slate-400 sm:text-[5px]">In Progress 18<br/>Completed 16<br/>Scheduled 6<br/>Pending 2</div>
                </div>
              </div>
              <div className="h-[73px] rounded border border-white/[.08] bg-[#0b1015] p-1.5 sm:h-[94px] sm:p-2">
                <div className="text-[5px] sm:text-[6px]">Revenue Overview</div>
                <svg viewBox="0 0 150 50" className="mt-2 h-11 w-full sm:h-14"><polyline points="0,42 18,36 35,38 52,29 70,32 88,20 105,24 124,10 142,14 150,8" fill="none" stroke={blue} strokeWidth="2" /></svg>
              </div>
            </div>

            <div className="mt-1.5 grid grid-cols-[1.18fr_1fr] gap-1.5">
              <div className="h-[51px] rounded border border-white/[.08] bg-[#0b1015] p-1.5 text-[4.5px] sm:h-[65px] sm:text-[5.5px]">
                <div className="mb-1 text-[5px] text-white sm:text-[6px]">Upcoming Jobs</div>
                <div>Kitchen Renovation <span className="float-right rounded bg-[#0c3761] px-1 text-[#65adff]">Today</span></div>
                <div className="mt-1">Bathroom Fitout <span className="float-right rounded bg-[#0c3761] px-1 text-[#65adff]">Tomorrow</span></div>
              </div>
              <div className="h-[51px] rounded border border-white/[.08] bg-[#0b1015] p-1.5 text-[4.5px] text-slate-400 sm:h-[65px] sm:text-[5.5px]">
                <div className="mb-1 text-[5px] text-white sm:text-[6px]">Recent Activity</div>
                <div>Invoice paid <span className="float-right">2m</span></div>
                <div className="mt-1">New quote sent <span className="float-right">15m</span></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function LockedMobileHome() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04090e] text-white [font-family:Inter,Arial,sans-serif]">
      <section className="relative overflow-hidden bg-[#111315] px-5 pb-6 sm:px-7">
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#2b2d2f_0%,#202326_30%,#12171b_62%,#050a0f_100%)]" />
        <div className="absolute inset-0 opacity-70 [background-image:repeating-linear-gradient(18deg,rgba(255,255,255,.018)_0px,rgba(255,255,255,.018)_1px,transparent_1px,transparent_4px),repeating-linear-gradient(104deg,rgba(0,0,0,.17)_0px,rgba(0,0,0,.17)_2px,transparent_2px,transparent_8px)]" />
        <div className="absolute right-[-25%] top-[36%] h-[330px] w-[420px] rounded-full bg-[#168dff]/10 blur-[65px]" />

        <header className="relative z-20 flex h-[72px] items-center justify-between">
          <Link href="/" aria-label="YourPlan home"><BrandLogo /></Link>
          <details className="group relative">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/20 bg-black/20 marker:hidden" aria-label="Open menu"><Menu size={22} /></summary>
            <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-white/10 bg-[#071019] p-2 shadow-2xl">
              {["Features", "Industries", "Pricing", "About", "Resources", "Contact"].map((label) => <Link key={label} href={`/${label.toLowerCase()}`} className="block rounded-lg px-3 py-2 text-sm text-slate-200">{label}</Link>)}
              <Link href="/login" className="mt-1 block rounded-lg border border-white/15 px-3 py-2 text-sm">Login</Link>
              <Link href="/contact" className="mt-2 block rounded-lg bg-[#0b86ff] px-3 py-2 text-center text-sm">Book a Demo</Link>
            </div>
          </details>
        </header>

        <div className="relative z-10 pt-3">
          <h1 className="text-[42px] font-black uppercase leading-[1.08] tracking-[-.04em] sm:text-[54px]">
            <span className="text-[#168dff]">YOUR</span> BUSINESS.<br/>
            <span className="text-[#168dff]">YOUR</span> WAY.<br/>
            <span className="text-[#168dff]">YOUR</span> PLAN.
          </h1>
          <p className="mt-5 text-[14px] leading-[1.55] text-slate-100 sm:text-[16px]">All-in-one business management software<br/>built for trade and service businesses.<br/>Manage, automate, and grow — on your terms.</p>
          <div className="mt-5 grid max-w-[390px] grid-cols-2 gap-3">
            <Link href="/contact" className="flex h-12 items-center justify-center rounded-[7px] bg-[#0c84ff] text-[13px] font-medium shadow-[0_0_18px_rgba(22,141,255,.28)]">→ &nbsp;Book a Demo</Link>
            <Link href="/features" className="flex h-12 items-center justify-center rounded-[7px] border border-white/40 bg-[#10161c]/80 text-[13px]">See Features</Link>
          </div>
          <div className="mt-5 inline-flex h-9 items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 text-[9px] uppercase tracking-[.09em] text-slate-200">Powered by <BrandLogo small /></div>
          <DashboardCard />
        </div>
      </section>

      <section className="mx-3 mt-3 overflow-hidden rounded-[8px] border border-white/15 bg-[#0a1015] sm:mx-5">
        <div className="grid grid-cols-3 sm:grid-cols-4">
          {modules.map(([label, Icon], index) => <div key={label} className={`flex min-h-[74px] flex-col items-center justify-center gap-2 border-white/[.08] text-center text-[10px] ${(index % 3) ? "border-l sm:border-l" : ""} ${index >= 3 ? "border-t" : ""}`}><Icon size={20} strokeWidth={1.6} className="text-[#168dff]"/><span>{label}</span></div>)}
        </div>
      </section>

      <section className="mx-3 mt-3 grid gap-3 sm:mx-5">
        <div className="rounded-[8px] border border-white/15 bg-[#0a1015] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#168dff]">Simple, transparent pricing</p>
          <div className="mt-3 text-[54px] font-semibold leading-none text-[#168dff]">$50 <span className="text-[16px] font-normal text-white">/ month</span></div>
          <div className="mt-5 space-y-3 text-[13px] text-slate-100">{["No joining fee", "Free trial on request", "Cancel anytime", "Custom add-ons quoted separately"].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-[#168dff]"/><span>{item}</span></div>)}</div>
        </div>
        <div className="rounded-[8px] border border-white/15 bg-[#0a1015] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#168dff]">Built for your industry</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">{industries.map(([label, Icon]) => <div key={label} className="flex flex-col items-center gap-2 border-white/[.08] text-center text-[11px]"><Icon size={25} strokeWidth={1.5}/><span>{label}</span></div>)}</div>
          <p className="mt-5 text-center text-[12px] text-slate-400">YourPlan adapts to your business, not the other way around.</p>
        </div>
      </section>

      <footer className="mx-3 mb-5 mt-3 rounded-[8px] border border-white/15 bg-[#0a1015] p-5 sm:mx-5">
        <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#168dff] text-[20px] font-semibold"><span className="text-[#168dff]">Y</span>P</div><div><div className="text-[9px] uppercase tracking-[.08em] text-slate-300">Powered by</div><BrandLogo /></div></div>
        <p className="mt-4 text-[12px] text-slate-300">One platform. Built for your business.</p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-[11px] text-slate-400"><div><div className="mb-2 text-white">PRODUCT</div><div className="space-y-1.5"><div>Features</div><div>Pricing</div><div>Integrations</div><div>Changelog</div></div></div><div><div className="mb-2 text-white">COMPANY</div><div className="space-y-1.5"><div>About Us</div><div>Careers</div><div>Partners</div><div>Contact Us</div></div></div><div><div className="mb-2 text-white">RESOURCES</div><div className="space-y-1.5"><div>Help Centre</div><div>Community</div><div>Blog</div><div>Guides</div></div></div></div>
        <div className="mt-6 rounded-[7px] border border-white/[.08] bg-[#0d1319] p-4"><div className="text-[15px] font-medium">Ready to transform your business?</div><div className="mt-1 text-[12px] text-slate-400">Book a demo today and see the difference.</div><Link href="/contact" className="mt-3 inline-flex h-10 items-center justify-center rounded-[6px] bg-[#0c84ff] px-5 text-[12px]">Book a Demo &nbsp; →</Link></div>
        <div className="mt-5 border-t border-white/[.08] pt-4 text-[10px] text-slate-500"><div>© 2025 YourPlan. All rights reserved.</div><div className="mt-2 flex items-center gap-4"><span>Privacy Policy</span><span>Terms of Service</span><span className="ml-auto text-white">f &nbsp; in &nbsp; ▶</span></div></div>
      </footer>
    </main>
  );
}
