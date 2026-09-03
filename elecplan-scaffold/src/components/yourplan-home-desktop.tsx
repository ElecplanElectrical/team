import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  Hammer,
  Leaf,
  Package,
  Settings,
  Users,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";

const BLUE = "#138cff";

const nav = [
  ["Features", "/features", true],
  ["Industries", "/industries", true],
  ["Pricing", "/pricing", false],
  ["About", "/about", false],
  ["Resources", "/resources", true],
  ["Contact", "/contact", false],
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
  ["Mechanical", Settings],
  ["Trades", Hammer],
  ["Service Businesses", Wrench],
] as const;

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline font-medium tracking-[-.075em] [font-family:Sora,Inter,sans-serif] ${small ? "text-[24px]" : "text-[31px]"}`}
      aria-label="YourPlan"
    >
      <span className="text-[#138cff]">Your</span>
      <span className="text-white">plan</span>
    </span>
  );
}

function MiniLine({ points = "0,17 15,13 30,15 45,8 60,11 75,5 90,8 105,3" }: { points?: string }) {
  return (
    <svg viewBox="0 0 105 22" className="h-[18px] w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={BLUE} strokeWidth="1.8" />
    </svg>
  );
}

function DashboardMockup() {
  const sidebar = [
    ["Dashboard", BarChart3],
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

  return (
    <div className="relative mx-auto h-[445px] w-full max-w-[715px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[44px] bg-[#087dff]/25 blur-[62px]" />
      <div className="absolute inset-[2px] rounded-[16px] border border-[#1d77bd]/80 bg-[#03080d] shadow-[0_28px_70px_rgba(0,0,0,.62),0_0_36px_rgba(19,140,255,.26)]">
        <div className="grid h-full grid-cols-[158px_1fr] overflow-hidden rounded-[15px]">
          <aside className="border-r border-white/[.08] bg-[#05090e] px-4 py-4">
            <div className="mb-5 flex items-center justify-between">
              <Wordmark small />
            </div>
            <div className="space-y-1">
              {sidebar.map(([label, Icon], index) => (
                <div
                  key={label}
                  className={`flex h-[26px] items-center gap-2 rounded px-2 text-[8.5px] ${index === 0 ? "border border-[#138cff]/30 bg-[#08223a] text-white" : "text-slate-400"}`}
                >
                  <Icon size={11} strokeWidth={1.65} className={index === 0 ? "text-[#138cff]" : "text-slate-500"} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="bg-[radial-gradient(circle_at_78%_25%,rgba(19,140,255,.08),transparent_32%),#060b10] px-4 pb-4 pt-3">
            <div className="flex h-9 items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-[-.025em]">Dashboard</h3>
              <div className="flex items-center gap-2">
                <div className="rounded border border-white/[.08] bg-[#090f15] px-2.5 py-1.5 text-[7px] text-slate-400">May 12 – May 18, 2025⌄</div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#138cff]/80 text-[8px] font-semibold"><span className="text-[#138cff]">Y</span>P</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {[
                ["Total Jobs", "42", "+12% vs last 7 days"],
                ["Revenue", "$124,580", "+18% vs last 7 days"],
                ["Quotes Sent", "37", "+9% vs last 7 days"],
                ["Invoices Paid", "28", "+15% vs last 7 days"],
              ].map(([label, value, meta]) => (
                <div key={label} className="h-[82px] rounded-md border border-white/[.08] bg-[#080e14] p-2.5">
                  <p className="text-[6.5px] text-slate-500">{label}</p>
                  <p className="mt-1 text-[14px] font-semibold tracking-[-.02em]">{value}</p>
                  <p className="mt-1 text-[5.5px] text-slate-500">{meta}</p>
                  <div className="mt-1.5"><MiniLine /></div>
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-[.86fr_1.14fr] gap-2">
              <div className="h-[139px] rounded-md border border-white/[.08] bg-[#080e14] p-3">
                <p className="text-[7px] font-medium">Job Overview</p>
                <div className="mt-3 flex items-center gap-5">
                  <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-[8px] border-[#138cff] shadow-[0_0_22px_rgba(19,140,255,.16)]">
                    <div className="text-center">
                      <p className="text-[20px] font-semibold leading-none">42</p>
                      <p className="mt-1 text-[5.5px] text-slate-500">Total Jobs</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-[6.5px] text-slate-400">
                    <p className="flex w-[88px] justify-between"><span>In Progress</span><b className="font-medium text-slate-200">18</b></p>
                    <p className="flex w-[88px] justify-between"><span>Completed</span><b className="font-medium text-slate-200">16</b></p>
                    <p className="flex w-[88px] justify-between"><span>Scheduled</span><b className="font-medium text-slate-200">6</b></p>
                    <p className="flex w-[88px] justify-between"><span>Pending</span><b className="font-medium text-slate-200">2</b></p>
                  </div>
                </div>
              </div>

              <div className="h-[139px] rounded-md border border-white/[.08] bg-[#080e14] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[7px] font-medium">Revenue Overview</p>
                  <span className="text-[5.5px] text-slate-500">$24,680</span>
                </div>
                <div className="relative mt-3 h-[92px]">
                  {[18, 42, 66].map((bottom) => <div key={bottom} className="absolute inset-x-0 h-px bg-white/[.05]" style={{ bottom }} />)}
                  <svg viewBox="0 0 280 92" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                    <polyline points="0,82 26,71 52,64 78,68 104,50 130,56 156,38 182,47 208,28 234,34 260,17 280,20" fill="none" stroke={BLUE} strokeWidth="2.2" />
                    <polyline points="0,82 26,71 52,64 78,68 104,50 130,56 156,38 182,47 208,28 234,34 260,17 280,20 280,92 0,92" fill="rgba(19,140,255,.08)" stroke="none" />
                  </svg>
                  <div className="absolute right-[34%] top-[19%] rounded border border-white/[.08] bg-[#0c131a] px-2 py-1 text-[5.5px] text-slate-300 shadow-xl">
                    <div className="text-slate-500">May 16</div><b>$24,680</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-[1.05fr_.95fr] gap-2">
              <div className="h-[87px] rounded-md border border-white/[.08] bg-[#080e14] p-3">
                <p className="text-[7px] font-medium">Upcoming Jobs</p>
                <div className="mt-2 space-y-2 text-[6.2px] text-slate-400">
                  <div className="flex items-center justify-between"><span><b className="font-medium text-slate-200">Kitchen Renovation</b><br />123 Smith Street, Sydney NSW</span><span className="rounded bg-[#0a3760] px-2 py-1 text-[#138cff]">Today</span></div>
                  <div className="flex items-center justify-between"><span><b className="font-medium text-slate-200">Bathroom Fitout</b><br />45 High Street, Melbourne VIC</span><span className="rounded bg-[#0a3760] px-2 py-1 text-[#138cff]">Tomorrow</span></div>
                </div>
              </div>
              <div className="h-[87px] rounded-md border border-white/[.08] bg-[#080e14] p-3">
                <p className="text-[7px] font-medium">Recent Activity</p>
                <div className="mt-2 space-y-1.5 text-[5.8px] text-slate-400">
                  <p className="flex justify-between"><span>Invoice #INV-1042 paid</span><span>2m ago</span></p>
                  <p className="flex justify-between"><span>New quote #Q-2048 sent</span><span>15m ago</span></p>
                  <p className="flex justify-between"><span>Job #JOB-308 updated</span><span>32m ago</span></p>
                  <p className="flex justify-between"><span>Timesheet submitted</span><span>1h ago</span></p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function DesktopHomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05080c] text-white [font-family:Inter,Arial,sans-serif]">
      <div className="mx-auto w-full max-w-[1500px] px-8 py-0">
        <div className="overflow-hidden bg-[radial-gradient(circle_at_69%_33%,rgba(11,119,235,.18),transparent_29%),radial-gradient(circle_at_17%_8%,rgba(255,255,255,.11),transparent_26%),linear-gradient(122deg,#23262a_0%,#15191e_24%,#080d12_57%,#02070b_100%)]">
          <header className="h-[78px] border-b border-white/[.04]">
            <div className="flex h-full items-center px-1">
              <Link href="/" className="w-[280px] pl-1"><Wordmark /></Link>
              <nav className="flex flex-1 items-center justify-center gap-9" aria-label="Primary navigation">
                {nav.map(([label, href, dropdown]) => (
                  <Link key={label} href={href} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-300 transition hover:text-white">
                    {label}{dropdown ? <ChevronDown size={12} strokeWidth={1.8} /> : null}
                  </Link>
                ))}
              </nav>
              <div className="flex w-[280px] items-center justify-end gap-3 pr-1">
                <Link href="/login" className="inline-flex h-10 items-center rounded-lg border border-white/25 bg-black/10 px-5 text-[12px] font-medium">Login</Link>
                <Link href="/contact" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#138cff] px-5 text-[12px] font-medium shadow-[0_0_24px_rgba(19,140,255,.22)]">Book a Demo <ArrowRight size={14} /></Link>
              </div>
            </div>
          </header>

          <section className="grid h-[490px] grid-cols-[42%_58%] items-center gap-4 px-6">
            <div className="pl-1">
              <h1 className="text-[64px] font-black uppercase leading-[.96] tracking-[-.048em]">
                <span className="text-[#138cff]">YOUR</span> BUSINESS.<br />
                <span className="text-[#138cff]">YOUR</span> WAY.<br />
                <span className="text-[#138cff]">YOUR</span> PLAN.
              </h1>
              <p className="mt-5 max-w-[440px] text-[16px] leading-[1.42] text-slate-300">
                All-in-one business management software<br />
                built for trade and service businesses.<br />
                Manage, automate, and grow—on your terms.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link href="/contact" className="inline-flex h-11 items-center gap-3 rounded-lg bg-[#138cff] px-6 text-[13px] font-medium shadow-[0_0_22px_rgba(19,140,255,.23)]"><ArrowRight size={17} /> Book a Demo</Link>
                <Link href="/features" className="inline-flex h-11 items-center rounded-lg border border-white/30 bg-black/10 px-6 text-[13px] font-medium">See Features</Link>
              </div>
              <div className="mt-7 inline-flex h-9 items-center gap-3 rounded-full border border-white/25 bg-black/10 px-4">
                <span className="text-[9px] font-medium uppercase tracking-[.08em] text-slate-400">Powered by</span>
                <Wordmark small />
              </div>
            </div>
            <div className="relative pr-0 pt-1">
              <DashboardMockup />
            </div>
          </section>
        </div>

        <section className="-mt-px rounded-[15px] border border-white/[.18] bg-[#0a0f14] shadow-[0_18px_48px_rgba(0,0,0,.22)]">
          <div className="grid h-[88px] grid-cols-12">
            {modules.map(([label, Icon], index) => (
              <Link key={label} href="/features" className={`flex flex-col items-center justify-center gap-2 px-1 text-center ${index ? "border-l border-white/[.09]" : ""}`}>
                <Icon size={22} strokeWidth={1.65} className="text-[#138cff]" />
                <span className="text-[9.5px] font-medium leading-3 text-slate-100">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3">
          <div className="h-[160px] rounded-[15px] border border-white/[.14] bg-[linear-gradient(135deg,#0b1015,#090d12)] px-7 py-5">
            <div className="flex h-full items-center">
              <div className="w-[46%]">
                <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#138cff]">Simple, transparent pricing</p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-[58px] font-black leading-none tracking-[-.05em] text-[#138cff]">$50</span>
                  <span className="pb-2 text-[16px] text-slate-100">/ month</span>
                </div>
              </div>
              <div className="h-[105px] w-px bg-white/[.12]" />
              <div className="ml-8 grid gap-3 text-[11px] text-slate-300">
                {["No joining fee", "Free trial on request", "Cancel anytime", "Custom add-ons quoted separately"].map((item) => (
                  <div key={item} className="flex items-center gap-3"><span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#138cff]/70 text-[9px] text-[#138cff]">✓</span><span>{item}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[160px] rounded-[15px] border border-white/[.14] bg-[linear-gradient(135deg,#0b1015,#090d12)] px-7 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#138cff]">Built for your industry</p>
            <div className="mt-4 grid grid-cols-5">
              {industries.map(([label, Icon], index) => (
                <div key={label} className={`flex h-[62px] flex-col items-center justify-center gap-2 px-2 text-center ${index ? "border-l border-white/[.10]" : ""}`}>
                  <Icon size={25} strokeWidth={1.55} className="text-slate-100" />
                  <span className="text-[9px] leading-3 text-slate-200">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[12px] text-slate-400">YourPlan adapts to your business, not the other way around.</p>
          </div>
        </section>

        <footer className="mt-3 pb-4">
          <div className="grid h-[165px] grid-cols-[1.28fr_.75fr_.75fr_.75fr_1.55fr] gap-6 rounded-[15px] border border-white/[.14] bg-[#090d12] px-7 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 border-[#138cff] bg-[#0c1117] text-[29px] font-medium tracking-[-.08em]"><span className="text-[#138cff]">Y</span>P</div>
              <div>
                <p className="text-[10px] uppercase tracking-[.08em] text-slate-400">Powered by</p>
                <div className="mt-1"><Wordmark /></div>
                <p className="mt-4 text-[11px] text-slate-400">One platform. Built for your business.</p>
              </div>
            </div>

            <FooterColumn title="Product" items={[["Features", "/features"], ["Pricing", "/pricing"], ["Integrations", "/features"], ["Changelog", "/resources"]]} />
            <FooterColumn title="Company" items={[["About Us", "/about"], ["Careers", "/contact"], ["Partners", "/contact"], ["Contact Us", "/contact"]]} />
            <FooterColumn title="Resources" items={[["Help Centre", "/resources"], ["Community", "/resources"], ["Blog", "/resources"], ["Guides", "/resources"]]} />

            <div className="my-auto rounded-xl border border-white/[.10] bg-[#0c1117] px-7 py-5">
              <h3 className="text-[17px] font-medium">Ready to transform your business?</h3>
              <p className="mt-1 text-[11px] text-slate-400">Book a demo today and see the difference.</p>
              <Link href="/contact" className="mt-4 inline-flex h-10 items-center gap-8 rounded-lg bg-[#138cff] px-5 text-[12px] font-medium">Book a Demo <ArrowRight size={15} /></Link>
            </div>
          </div>

          <div className="flex h-[54px] items-center justify-between px-3 text-[10px] text-slate-500">
            <span>© 2025 YourPlan. All rights reserved.</span>
            <div className="flex items-center gap-7">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <span className="h-5 w-px bg-white/[.12]" />
              <span className="text-[17px] font-semibold text-white">f</span>
              <span className="text-[12px] font-semibold text-white">in</span>
              <span className="text-[13px] text-white">▶</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FooterColumn({ title, items }: { title: string; items: readonly (readonly [string, string])[] }) {
  return (
    <div className="pt-2">
      <p className="text-[10px] font-medium uppercase tracking-[.05em] text-slate-200">{title}</p>
      <div className="mt-4 grid gap-2.5">
        {items.map(([label, href]) => <Link key={label} href={href} className="text-[10px] text-slate-400 hover:text-white">{label}</Link>)}
      </div>
    </div>
  );
}
