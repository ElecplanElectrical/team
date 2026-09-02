import Link from "next/link";
import YourPlanMark from "@/components/YourPlanMark";
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
  ["Jobs", BriefcaseBusiness], ["Leads & CRM", Users], ["Quotes", FileText], ["Invoices", WalletCards],
  ["Calendar", CalendarDays], ["Staff", Users], ["Timesheets", CalendarDays], ["Documents", FileText],
  ["Stock", Package], ["Reminders", Bell], ["Reporting", BarChart3], ["AI & Automation", Settings],
] as const;

const industries = [
  ["Electrical", Zap], ["Landscaping", Leaf], ["Mechanical", Settings], ["Trades", Hammer], ["Service Businesses", Wrench],
] as const;

function ExactYourPlanLogo({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-label="YourPlan"
      role="img"
      className={`block shrink-0 ${small ? "h-[24px] w-[108px]" : "h-[43px] w-[188px]"}`}
      style={{
        backgroundImage: "url('/api/approved-home')",
        backgroundRepeat: "no-repeat",
        backgroundSize: small ? "832px 624px" : "1448px 1086px",
        backgroundPosition: small ? "-22px -12px" : "-38px -20px",
      }}
    />
  );
}

function YpMark() {\n  return <YourPlanMark size={69} />;\n}

function MiniLine({ wide = false }: { wide?: boolean }) {
  return <svg viewBox="0 0 160 28" className={wide ? "h-7 w-full" : "h-5 w-full"} aria-hidden="true"><polyline points="0,23 18,20 34,21 48,16 65,18 82,14 100,15 116,9 133,11 150,5 160,7" fill="none" stroke={blue} strokeWidth="2" /></svg>;
}

function Dashboard() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[16px] border border-[#168dff]/35 bg-[#080d12] shadow-[0_0_28px_rgba(22,141,255,.55),0_24px_70px_rgba(0,0,0,.52)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.03),transparent_38%)]" />
      <div className="relative flex h-full">
        <aside className="w-[18.7%] border-r border-white/[.07] bg-[#070b0f] px-[clamp(14px,1vw,20px)] py-[clamp(14px,1vw,20px)]">
          <ExactYourPlanLogo small />
          <div className="mt-5 space-y-[clamp(6px,.42vw,8px)] text-[clamp(9px,.62vw,12px)] text-slate-300">
            {["Dashboard","Jobs","Leads & CRM","Quotes","Invoices","Calendar","Staff","Timesheets","Documents","Stock","Reminders","Reporting","AI & Automation"].map((item, i) => (
              <div key={item} className={`flex h-[clamp(21px,1.45vw,28px)] items-center gap-2 rounded px-2 ${i === 0 ? "bg-[#0b3763] text-white" : ""}`}>
                <span className={`h-2.5 w-2.5 rounded-[2px] border ${i === 0 ? "border-[#168dff]" : "border-white/45"}`} /><span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
        <section className="flex-1 px-[clamp(15px,1.05vw,21px)] py-[clamp(15px,1.05vw,21px)]">
          <div className="flex items-center justify-between"><h3 className="text-[clamp(15px,1.04vw,20px)] font-semibold">Dashboard</h3><div className="text-[clamp(8px,.55vw,11px)] text-slate-400">May 12 – May 18, 2025</div></div>
          <div className="mt-4 grid grid-cols-4 gap-[clamp(10px,.7vw,14px)]">
            {[["Total Jobs","42"],["Revenue","$124,580"],["Quotes Sent","37"],["Invoices Paid","28"]].map(([label,value]) => <div key={label} className="h-[clamp(88px,6.1vw,117px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[clamp(9px,.62vw,12px)] text-slate-300">{label}</div><div className="mt-1 text-[clamp(18px,1.25vw,24px)] font-semibold">{value}</div><div className="mt-2"><MiniLine /></div></div>)}
          </div>
          <div className="mt-3 grid grid-cols-[.92fr_1.45fr] gap-[clamp(10px,.7vw,14px)]">
            <div className="h-[clamp(142px,9.8vw,188px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[clamp(10px,.69vw,13px)]">Job Overview</div><div className="mt-4 flex items-center gap-5"><div className="flex h-[clamp(78px,5.4vw,104px)] w-[clamp(78px,5.4vw,104px)] items-center justify-center rounded-full border-[11px] border-[#168dff] border-r-[#1b2631] border-b-[#1b2631]"><div className="text-center"><div className="text-[clamp(19px,1.3vw,25px)]">42</div><div className="text-[8px] text-slate-400">Total Jobs</div></div></div><div className="space-y-2 text-[clamp(8px,.55vw,11px)] text-slate-300"><div>In Progress 18</div><div>Completed 16</div><div>Scheduled 6</div><div>Pending 2</div></div></div></div>
            <div className="h-[clamp(142px,9.8vw,188px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[clamp(10px,.69vw,13px)]">Revenue Overview</div><div className="mt-7"><MiniLine wide /></div></div>
          </div>
          <div className="mt-3 grid grid-cols-[1.18fr_1fr] gap-[clamp(10px,.7vw,14px)]"><div className="h-[clamp(95px,6.55vw,126px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[clamp(8px,.55vw,11px)]"><div className="mb-2 text-[clamp(10px,.69vw,13px)]">Upcoming Jobs</div><div>Kitchen Renovation <span className="float-right rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Today</span></div><div className="mt-3">Bathroom Fitout <span className="float-right rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Tomorrow</span></div></div><div className="h-[clamp(95px,6.55vw,126px)] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[clamp(8px,.55vw,11px)] text-slate-300"><div className="mb-2 text-[clamp(10px,.69vw,13px)] text-white">Recent Activity</div><div className="space-y-2"><div>Invoice paid <span className="float-right">2m ago</span></div><div>New quote sent <span className="float-right">15m ago</span></div><div>Job updated <span className="float-right">32m ago</span></div></div></div></div>
        </section>
      </div>
    </div>
  );
}

function Headline() {
  return (
    <div className="space-y-[.03em] text-[clamp(57px,4.05vw,78px)] font-black uppercase leading-[1.15] tracking-[-.035em]">
      {[["YOUR","BUSINESS."],["YOUR","WAY."],["YOUR","PLAN."]].map(([a,b]) => <div key={b} className="grid grid-cols-[2.65em_1fr] items-baseline"><span className="text-[#168dff]">{a}</span><span>{b}</span></div>)}
    </div>
  );
}

export function LockedExactHome() {
  return (
    <main className="min-h-screen w-full bg-[#04090e] text-white [font-family:Inter,Arial,sans-serif]">
      <div className="w-full overflow-hidden bg-[#050a0f]">
        <section className="relative h-[clamp(570px,39.5vw,760px)] overflow-hidden bg-[#111315]">
          <div className="absolute inset-0 bg-[linear-gradient(112deg,#2c2d2f_0%,#222426_25%,#15181b_53%,#080d12_78%,#05090d_100%)]" />
          <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(18deg,rgba(255,255,255,.018)_0px,rgba(255,255,255,.018)_1px,transparent_1px,transparent_4px),repeating-linear-gradient(104deg,rgba(0,0,0,.16)_0px,rgba(0,0,0,.16)_2px,transparent_2px,transparent_8px),radial-gradient(circle_at_16%_30%,rgba(255,255,255,.07),transparent_24%),radial-gradient(circle_at_38%_80%,rgba(255,255,255,.025),transparent_22%)]" />
          <div className="absolute left-0 top-0 h-full w-[48%] bg-[radial-gradient(ellipse_at_28%_42%,rgba(255,255,255,.055),transparent_54%)]" />
          <div className="absolute right-[3%] top-[14%] h-[62%] w-[48%] rounded-full bg-[#168dff]/[.08] blur-[72px]" />

          <header className="relative z-20 mx-auto flex h-[clamp(78px,5.4vw,104px)] w-[92.5%] items-center justify-between">
            <Link href="/" aria-label="YourPlan home"><ExactYourPlanLogo /></Link>
            <nav className="flex items-center gap-[clamp(28px,2vw,40px)] text-[clamp(12px,.83vw,16px)] text-slate-100"><Link href="/features">Features⌄</Link><Link href="/industries">Industries⌄</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/resources">Resources⌄</Link><Link href="/contact">Contact</Link></nav>
            <div className="flex items-center gap-3"><Link href="/login" className="rounded-[7px] border border-white/35 px-[clamp(18px,1.3vw,25px)] py-[clamp(11px,.78vw,15px)] text-[clamp(12px,.83vw,16px)]">Login</Link><Link href="/contact" className="rounded-[7px] bg-[#0b86ff] px-[clamp(22px,1.55vw,30px)] py-[clamp(11px,.78vw,15px)] text-[clamp(12px,.83vw,16px)] shadow-[0_0_18px_rgba(22,141,255,.28)]">Book a Demo</Link></div>
          </header>

          <div className="relative z-10 mx-auto grid w-[91%] grid-cols-[41.5%_58.5%] gap-4 pt-[clamp(15px,1vw,20px)]">
            <div className="pt-[clamp(24px,1.7vw,33px)]"><Headline/><p className="mt-5 w-[clamp(405px,28vw,538px)] text-[clamp(15px,1.05vw,20px)] leading-[1.5] text-slate-100">All-in-one business management software<br/>built for trade and service businesses.<br/>Manage, automate, and grow—on your terms.</p><div className="mt-6 flex gap-3"><Link href="/contact" className="flex h-[clamp(47px,3.2vw,61px)] w-[clamp(174px,12vw,230px)] items-center justify-center rounded-[7px] bg-[#0c84ff] text-[clamp(14px,.97vw,19px)]">→ &nbsp;Book a Demo</Link><Link href="/features" className="flex h-[clamp(47px,3.2vw,61px)] w-[clamp(145px,10vw,192px)] items-center justify-center rounded-[7px] border border-white/45 bg-[#11171d]/70 text-[clamp(14px,.97vw,19px)]">See Features</Link></div><div className="mt-6 inline-flex h-[clamp(34px,2.3vw,44px)] items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 text-[clamp(10px,.69vw,13px)] uppercase tracking-[.09em] text-slate-200">Powered by <ExactYourPlanLogo small /></div></div>
            <div className="relative h-[clamp(470px,32.4vw,622px)] [perspective:1600px]"><div className="absolute inset-[1.5%_0_0_2%] origin-[58%_55%] [transform:rotateY(-7deg)_rotateX(2.5deg)_rotateZ(-1.2deg)]"><Dashboard /></div></div>
          </div>
        </section>

        <section className="mx-auto -mt-[2px] w-[94%] rounded-[8px] border border-white/15 bg-[#0a1015]"><div className="grid h-[clamp(91px,6.28vw,121px)] grid-cols-12">{modules.map(([label,Icon],i)=><div key={label} className={`flex flex-col items-center justify-center gap-2 text-[clamp(11px,.76vw,15px)] ${i?"border-l border-white/[.09]":""}`}><Icon size={24} strokeWidth={1.6} className="text-[#168dff]"/><span>{label}</span></div>)}</div></section>

        <section className="mx-auto mt-[clamp(12px,.83vw,16px)] grid w-[94%] grid-cols-[45.5%_54.5%] gap-[clamp(14px,.97vw,19px)]"><div className="h-[clamp(164px,11.33vw,218px)] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(24px,1.66vw,32px)] py-[clamp(20px,1.38vw,27px)]"><p className="text-[clamp(12px,.83vw,16px)] font-semibold uppercase tracking-[.1em] text-[#168dff]">Simple, transparent pricing</p><div className="mt-3 flex items-center gap-[clamp(32px,2.2vw,42px)]"><div className="text-[clamp(70px,4.83vw,93px)] font-semibold leading-none text-[#168dff]">$50 <span className="text-[clamp(17px,1.17vw,23px)] font-normal text-white">/ month</span></div><div className="space-y-2 text-[clamp(13px,.9vw,17px)] text-slate-100">{["No joining fee","Free trial on request","Cancel anytime","Custom add-ons quoted separately"].map(x=><div key={x} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#168dff]"/>{x}</div>)}</div></div></div><div className="h-[clamp(164px,11.33vw,218px)] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(24px,1.66vw,32px)] py-[clamp(20px,1.38vw,27px)]"><p className="text-[clamp(12px,.83vw,16px)] font-semibold uppercase tracking-[.1em] text-[#168dff]">Built for your industry</p><div className="mt-5 grid grid-cols-5">{industries.map(([label,Icon],i)=><div key={label} className={`flex flex-col items-center gap-2 text-center text-[clamp(11px,.76vw,15px)] ${i?"border-l border-white/[.08]":""}`}><Icon size={28} strokeWidth={1.6}/><span>{label}</span></div>)}</div><p className="mt-4 text-center text-[clamp(12px,.83vw,16px)] text-slate-400">YourPlan adapts to your business, not the other way around.</p></div></section>

        <footer className="mx-auto mt-[clamp(13px,.9vw,17px)] w-[94%]"><div className="grid h-[clamp(147px,10.15vw,195px)] grid-cols-[28%_13%_13%_15%_31%] rounded-[8px] border border-white/15 bg-[#0a1015] px-[clamp(28px,1.93vw,37px)] py-[clamp(20px,1.38vw,27px)]"><div className="flex items-start gap-4"><YpMark/><div><div className="text-[clamp(10px,.69vw,13px)] uppercase tracking-[.08em] text-slate-300">Powered by</div><ExactYourPlanLogo small/><p className="mt-4 text-[clamp(12px,.83vw,16px)] text-slate-300">One platform. Built for your business.</p></div></div><div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">PRODUCT</b><div className="mt-3 space-y-2"><div>Features</div><div>Pricing</div><div>Integrations</div><div>Changelog</div></div></div><div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">COMPANY</b><div className="mt-3 space-y-2"><div>About Us</div><div>Careers</div><div>Partners</div><div>Contact Us</div></div></div><div className="text-[clamp(11px,.76vw,15px)] text-slate-300"><b className="text-white">RESOURCES</b><div className="mt-3 space-y-2"><div>Help Centre</div><div>Community</div><div>Blog</div><div>Guides</div></div></div><div className="rounded-[8px] border border-white/10 bg-[#0c1218] px-5 py-4"><div className="text-[clamp(16px,1.1vw,21px)]">Ready to transform your business?</div><div className="mt-1 text-[clamp(12px,.83vw,16px)] text-slate-400">Book a demo today and see the difference.</div><Link href="/contact" className="mt-4 inline-flex h-[clamp(39px,2.69vw,52px)] items-center rounded-[6px] bg-[#0b84ff] px-5 text-[clamp(13px,.9vw,17px)]">Book a Demo &nbsp;&nbsp;→</Link></div></div><div className="flex h-[clamp(58px,4vw,77px)] items-center justify-between px-3 text-[clamp(11px,.76vw,15px)] text-slate-400"><span>© 2025 YourPlan. All rights reserved.</span><div className="flex items-center gap-10"><span>Privacy Policy</span><span>Terms of Service</span><span className="text-white">f</span><span className="text-white">in</span><span className="text-white">▶</span></div></div></footer>
      </div>
    </main>
  );
}
