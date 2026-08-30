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

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-medium tracking-[-.075em] ${className}`}>
      <span style={{ color: blue }}>Your</span><span className="text-white">plan</span>
    </span>
  );
}

function YpMark() {
  return (
    <div className="flex h-[clamp(52px,3.6vw,69px)] w-[clamp(52px,3.6vw,69px)] items-center justify-center rounded-full border-2 border-[#168dff] text-[clamp(25px,1.73vw,33px)] font-semibold tracking-[-.08em]">
      <span className="text-[#168dff]">Y</span><span className="text-white">P</span>
    </div>
  );
}

function MiniLine({ wide = false }: { wide?: boolean }) {
  return (
    <svg viewBox="0 0 160 28" className={wide ? "h-7 w-full" : "h-5 w-full"} aria-hidden="true">
      <polyline points="0,23 18,20 34,21 48,16 65,18 82,14 100,15 116,9 133,11 150,5 160,7" fill="none" stroke={blue} strokeWidth="2" />
    </svg>
  );
}

function Dashboard() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-white/10 bg-[#080d12] shadow-[0_0_22px_rgba(22,141,255,.48),0_20px_60px_rgba(0,0,0,.48)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.025),transparent_38%)]" />
      <div className="relative flex h-full">
        <aside className="w-[18.7%] border-r border-white/[.07] bg-[#070b0f] px-[clamp(16px,1.1vw,22px)] py-[clamp(16px,1.1vw,22px)]">
          <Wordmark className="text-[clamp(16px,1.1vw,21px)]" />
          <div className="mt-5 space-y-[clamp(7px,.48vw,9px)] text-[clamp(10px,.69vw,13px)] text-slate-300">
            {["Dashboard","Jobs","Leads & CRM","Quotes","Invoices","Calendar","Staff","Timesheets","Documents","Stock","Reminders","Reporting","AI & Automation"].map((item, i) => (
              <div key={item} className={`flex h-[clamp(22px,1.52vw,29px)] items-center gap-2 rounded px-2 ${i === 0 ? "bg-[#0b3763] text-white" : ""}`}>
                <span className={`h-2.5 w-2.5 rounded-[2px] border ${i === 0 ? "border-[#168dff]" : "border-white/45"}`} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
        <section className="flex-1 px-[clamp(16px,1.1vw,22px)] py-[clamp(16px,1.1vw,22px)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[clamp(16px,1.1vw,21px)] font-semibold">Dashboard</h3>
            <div className="flex items-center gap-3 text-[clamp(8px,.55vw,11px)] text-slate-400">
              <span>May 12 – May 18, 2025</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#168dff]/60 text-[11px]"><span className="text-[#168dff]">Y</span>P</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-[clamp(12px,.83vw,16px)]">
            {[["Total Jobs","42"],["Revenue","$124,580"],["Quotes Sent","37"],["Invoices Paid","28"]].map(([label,value]) => (
              <div key={label} className="h-[clamp(92px,6.35vw,122px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3">
                <div className="text-[clamp(9px,.62vw,12px)] text-slate-300">{label}</div>
                <div className="mt-1 text-[clamp(19px,1.31vw,25px)] font-semibold">{value}</div>
                <div className="mt-2"><MiniLine /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-[.92fr_1.45fr] gap-[clamp(12px,.83vw,16px)]">
            <div className="h-[clamp(150px,10.36vw,199px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3">
              <div className="text-[clamp(10px,.69vw,13px)]">Job Overview</div>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative flex h-[clamp(82px,5.66vw,109px)] w-[clamp(82px,5.66vw,109px)] items-center justify-center rounded-full border-[12px] border-[#168dff] border-r-[#1b2631] border-b-[#1b2631]">
                  <div className="text-center"><div className="text-[clamp(20px,1.38vw,27px)] font-medium">42</div><div className="text-[clamp(8px,.55vw,11px)] text-slate-400">Total Jobs</div></div>
                </div>
                <div className="space-y-2 text-[clamp(9px,.62vw,12px)] text-slate-300"><div>In Progress &nbsp;&nbsp; 18</div><div>Completed &nbsp;&nbsp; 16</div><div>Scheduled &nbsp;&nbsp; 6</div><div>Pending &nbsp;&nbsp; 2</div></div>
              </div>
            </div>
            <div className="h-[clamp(150px,10.36vw,199px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3">
              <div className="text-[clamp(10px,.69vw,13px)]">Revenue Overview</div>
              <div className="mt-5"><MiniLine wide /></div>
              <div className="mt-2 flex justify-between text-[clamp(7px,.48vw,9px)] text-slate-500"><span>May 12</span><span>May 13</span><span>May 14</span><span>May 15</span><span>May 16</span><span>May 17</span><span>May 18</span></div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1.18fr_1fr] gap-[clamp(12px,.83vw,16px)]">
            <div className="h-[clamp(102px,7.04vw,135px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[clamp(9px,.62vw,12px)]">
              <div className="mb-2 text-[clamp(10px,.69vw,13px)]">Upcoming Jobs</div>
              <div className="flex items-center justify-between border-b border-white/[.05] py-1"><span>Kitchen Renovation<br/><span className="text-[clamp(7px,.48vw,9px)] text-slate-500">123 Smith Street, Sydney NSW</span></span><span className="rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Today</span></div>
              <div className="flex items-center justify-between py-1"><span>Bathroom Fitout<br/><span className="text-[clamp(7px,.48vw,9px)] text-slate-500">45 High Street, Melbourne VIC</span></span><span className="rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Tomorrow</span></div>
            </div>
            <div className="h-[clamp(102px,7.04vw,135px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[clamp(8px,.55vw,11px)] text-slate-300">
              <div className="mb-2 text-[clamp(10px,.69vw,13px)] text-white">Recent Activity</div>
              <div className="space-y-[6px]"><div>Invoice #INV-1042 paid <span className="float-right">2m ago</span></div><div>New quote #Q-1028 sent <span className="float-right">15m ago</span></div><div>Job #JOB-308 updated <span className="float-right">32m ago</span></div><div>Timesheet submitted <span className="float-right">1h ago</span></div></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LockedExactHome() {
  return (
    <main className="min-h-screen w-full bg-[#04090e] text-white [font-family:Inter,Arial,sans-serif]">
      <div className="w-full overflow-hidden bg-[#050a0f]">
        <section className="relative h-[clamp(562px,38.8vw,745px)] overflow-hidden bg-[linear-gradient(112deg,#424a53_0%,#242b32_25%,#0a1117_56%,#05090d_100%)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[clamp(130px,9vw,173px)] bg-[radial-gradient(ellipse_at_52%_-40%,rgba(255,255,255,.10),transparent_58%)]" />
          <div className="pointer-events-none absolute right-[5%] top-[clamp(76px,5.25vw,101px)] h-[clamp(460px,31.77vw,610px)] w-[clamp(680px,46.96vw,902px)] rounded-full bg-[#168dff]/[.07] blur-[72px]" />
          <header className="relative z-20 mx-auto flex h-[clamp(78px,5.39vw,104px)] w-[92.5%] items-center justify-between">
            <Link href="/" aria-label="YourPlan home"><Wordmark className="text-[clamp(31px,2.14vw,41px)]" /></Link>
            <nav className="flex items-center gap-[clamp(32px,2.2vw,42px)] text-[clamp(12px,.83vw,16px)] text-slate-100">
              <Link href="/features">Features⌄</Link><Link href="/industries">Industries⌄</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/resources">Resources⌄</Link><Link href="/contact">Contact</Link>
            </nav>
            <div className="flex items-center gap-3"><Link href="/login" className="rounded-[7px] border border-white/35 px-[clamp(20px,1.38vw,27px)] py-[clamp(12px,.83vw,16px)] text-[clamp(12px,.83vw,16px)]">Login</Link><Link href="/contact" className="rounded-[7px] bg-[#0b86ff] px-[clamp(24px,1.66vw,32px)] py-[clamp(12px,.83vw,16px)] text-[clamp(12px,.83vw,16px)] shadow-[0_0_18px_rgba(22,141,255,.28)]">Book a Demo</Link></div>
          </header>
          <div className="relative z-10 mx-auto grid w-[91%] grid-cols-[43%_57%] gap-2 pt-[clamp(16px,1.1vw,21px)]">
            <div className="pt-[clamp(25px,1.73vw,33px)]">
              <h1 className="text-[clamp(59px,4.08vw,78px)] font-black uppercase leading-[1.18] tracking-[-.035em]">
                <span className="text-[#168dff]">YOUR</span> BUSINESS.<br/>
                <span className="text-[#168dff]">YOUR</span> WAY.<br/>
                <span className="text-[#168dff]">YOUR</span>PLAN.
              </h1>
              <p className="mt-5 w-[clamp(405px,28vw,538px)] text-[clamp(16px,1.1vw,21px)] leading-[1.5] text-slate-100">All-in-one business management software<br/>built for trade and service businesses.<br/>Manage, automate, and grow—on your terms.</p>
              <div className="mt-6 flex gap-3"><Link href="/contact" className="flex h-[clamp(47px,3.25vw,62px)] w-[clamp(176px,12.15vw,234px)] items-center justify-center gap-3 rounded-[7px] bg-[#0c84ff] text-[clamp(14px,.97vw,19px)]">→ &nbsp;Book a Demo</Link><Link href="/features" className="flex h-[clamp(47px,3.25vw,62px)] w-[clamp(146px,10.08vw,194px)] items-center justify-center rounded-[7px] border border-white/45 bg-[#11171d]/70 text-[clamp(14px,.97vw,19px)]">See Features</Link></div>
              <div className="mt-6 inline-flex h-[clamp(34px,2.35vw,45px)] items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 text-[clamp(10px,.69vw,13px)] uppercase tracking-[.09em] text-slate-200">Powered by <Wordmark className="text-[clamp(15px,1.04vw,20px)] normal-case" /></div>
            </div>
            <div className="h-[clamp(468px,32.32vw,621px)] pt-[4px]"><Dashboard /></div>
          </div>
        </section>

        <section className="mx-auto -mt-[2px] w-[94%] rounded-[8px] border border-white/15 bg-[#0a1015]">
          <div className="grid h-[clamp(91px,6.28vw,121px)] grid-cols-12">
            {modules.map(([label, Icon], i) => <div key={label} className={`flex flex-col items-center justify-center gap-2 text-[clamp(11px,.76vw,15px)] ${i ? "border-l border-white/[.09]" : ""}`}><Icon size={24} strokeWidth={1.6} className="text-[#168dff]"/><span>{label}</span></div>)}
          </div>
        </section>

        <section className="mx-auto mt-[clamp(12px,.83vw,16px)] grid w-[94%] grid-cols-[45.5%_54.5%] gap-[clamp(14px,.97vw,19px)]">
          <div className="h-[clamp(164px,11.33vw,218px)] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(24px,1.66vw,32px)] py-[clamp(20px,1.38vw,27px)]">
            <p className="text-[clamp(12px,.83vw,16px)] font-semibold uppercase tracking-[.1em] text-[#168dff]">Simple, transparent pricing</p>
            <div className="mt-3 flex items-center gap-[clamp(32px,2.2vw,42px)]"><div className="text-[clamp(70px,4.83vw,93px)] font-semibold leading-none text-[#168dff]">$50 <span className="text-[clamp(17px,1.17vw,23px)] font-normal text-white">/ month</span></div><div className="space-y-2 text-[clamp(13px,.9vw,17px)] text-slate-100">{["No joining fee","Free trial on request","Cancel anytime","Custom add-ons quoted separately"].map(x=><div key={x} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#168dff]"/>{x}</div>)}</div></div>
          </div>
          <div className="h-[clamp(164px,11.33vw,218px)] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(24px,1.66vw,32px)] py-[clamp(20px,1.38vw,27px)]">
            <p className="text-[clamp(12px,.83vw,16px)] font-semibold uppercase tracking-[.1em] text-[#168dff]">Built for your industry</p>
            <div className="mt-5 grid grid-cols-5">{industries.map(([label,Icon],i)=><div key={label} className={`flex flex-col items-center gap-2 text-center text-[clamp(11px,.76vw,15px)] ${i?"border-l border-white/[.08]":""}`}><Icon size={28} strokeWidth={1.6}/><span>{label}</span></div>)}</div>
            <p className="mt-4 text-center text-[clamp(12px,.83vw,16px)] text-slate-400">YourPlan adapts to your business, not the other way around.</p>
          </div>
        </section>

        <footer className="mx-auto mt-[clamp(13px,.9vw,17px)] w-[94%]">
          <div className="grid h-[clamp(147px,10.15vw,195px)] grid-cols-[28%_13%_13%_15%_31%] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(28px,1.93vw,37px)] py-[clamp(20px,1.38vw,27px)]">
            <div className="flex items-start gap-4"><YpMark/><div><div className="text-[clamp(10px,.69vw,13px)] uppercase tracking-[.08em] text-slate-300">Powered by</div><Wordmark className="text-[clamp(27px,1.86vw,36px)]"/><p className="mt-4 text-[clamp(12px,.83vw,16px)] text-slate-300">One platform. Built for your business.</p></div></div>
            <div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">PRODUCT</b><div className="mt-3 space-y-2"><div>Features</div><div>Pricing</div><div>Integrations</div><div>Changelog</div></div></div>
            <div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">COMPANY</b><div className="mt-3 space-y-2"><div>About Us</div><div>Careers</div><div>Partners</div><div>Contact Us</div></div></div>
            <div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">RESOURCES</b><div className="mt-3 space-y-2"><div>Help Centre</div><div>Community</div><div>Blog</div><div>Guides</div></div></div>
            <div className="rounded-[8px] border border-white/10 bg-[#0c1218] px-5 py-4"><div className="text-[clamp(16px,1.1vw,21px)]">Ready to transform your business?</div><div className="mt-1 text-[clamp(12px,.83vw,16px)] text-slate-400">Book a demo today and see the difference.</div><Link href="/contact" className="mt-4 inline-flex h-[clamp(39px,2.69vw,52px)] items-center rounded-[6px] bg-[#0b84ff] px-5 text-[clamp(13px,.9vw,17px)]">Book a Demo &nbsp;&nbsp;→</Link></div>
          </div>
          <div className="flex h-[clamp(58px,4vw,77px)] items-center justify-between px-3 text-[clamp(11px,.76vw,15px)] text-slate-400"><span>© 2025 YourPlan. All rights reserved.</span><div className="flex items-center gap-10"><span>Privacy Policy</span><span>Terms of Service</span><span className="text-white">f</span><span className="text-white">in</span><span className="text-white">▶</span></div></div>
        </footer>
      </div>
    </main>
  );
}
