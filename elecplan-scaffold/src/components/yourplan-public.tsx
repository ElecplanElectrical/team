import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, CheckCircle2, ClipboardCheck, FileText, Menu, Package, Sparkles, Users, WalletCards } from "lucide-react";

const nav = [["Features","/features"],["Industries","/industries"],["Pricing","/pricing"],["About","/about"],["Resources","/resources"],["Contact","/contact"]] as const;
const modules = [
  ["Jobs",BriefcaseBusiness],["Leads",Users],["Quotes",FileText],["Calendar",CalendarDays],["Staff",Users],["Docs",FileText],["Stock",Package],["More",Sparkles]
] as const;
const featureCards = [
  ["Jobs","Manage work from creation through to completion.",BriefcaseBusiness],
  ["Scheduling","See what’s happening, who’s doing it and when.",CalendarDays],
  ["Clients & Leads","Keep customer information, opportunities and communication organised.",Users],
  ["Quotes & Invoices","Create, manage and track your business documents.",WalletCards],
  ["Staff & Timesheets","Manage your team, access and working hours.",CheckCircle2],
  ["Documents","Store important business and job documents in one place.",FileText],
  ["Stock","Track materials and stock across the business.",Package],
  ["Inspections","Keep checklists and inspection records connected to the work.",ClipboardCheck],
  ["Reporting","See the operation clearly from one dashboard.",BarChart3]
] as const;

export function Wordmark(){return <Link href="/" aria-label="YourPlan" className="inline-flex items-baseline text-[25px] font-black tracking-[-.08em] md:text-[29px]"><span className="text-[#168dff]">your</span><span className="text-white">plan</span></Link>}

export function PublicShell({children}:{children:React.ReactNode}){
  return <main className="min-h-screen overflow-x-hidden bg-[#03070d] text-white">
    <header className="relative z-30 border-b border-white/[.05] bg-[#050b12]/95">
      <div className="mx-auto flex h-[78px] max-w-[1180px] items-center justify-between px-6 md:h-[88px] md:px-8">
        <Wordmark/>
        <nav className="hidden items-center gap-7 lg:flex">{nav.map(([label,href])=><Link key={href} href={href} className="text-[13px] font-medium text-slate-300 transition hover:text-white">{label}</Link>)}</nav>
        <div className="hidden items-center gap-3 lg:flex"><Link href="/login" className="text-sm font-semibold text-slate-200">Login</Link><Link href="/contact" className="rounded-lg bg-[#168dff] px-4 py-2.5 text-sm font-semibold">Book a Demo</Link></div>
        <div className="flex items-center gap-4 lg:hidden"><Link href="/login" className="text-sm font-semibold text-slate-300">Login</Link><Menu size={25} strokeWidth={1.8}/></div>
      </div>
    </header>
    <div className="relative z-10">{children}</div>
    <footer className="relative z-10 border-t border-white/[.06] bg-[#02050a]"><div className="mx-auto max-w-[1180px] px-6 py-10 md:px-8"><div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><Wordmark/><p className="mt-3 max-w-md text-sm leading-6 text-slate-500">One platform built around the way your business actually works.</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">{nav.map(([l,h])=><Link key={h} href={h}>{l}</Link>)}<Link href="/login">Login</Link></div></div></div></footer>
  </main>
}

export function HomePage(){return <PublicShell>
  <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(121,133,148,.38),transparent_34%),linear-gradient(180deg,#242c35_0%,#101820_29%,#050b12_62%,#03070d_100%)]">
    <div className="mx-auto max-w-[1180px] px-6 pb-0 pt-14 text-center md:px-8 md:pt-20">
      <h1 className="mx-auto max-w-5xl text-[43px] font-black uppercase leading-[.96] tracking-[-.055em] sm:text-6xl md:text-[78px] lg:text-[94px]"><span className="text-[#168dff]">YOUR</span> BUSINESS.<br/><span className="text-[#168dff]">YOUR</span> WAY.<br/><span className="text-[#168dff]">YOUR</span> PLAN.</h1>
      <p className="mx-auto mt-7 max-w-2xl text-[18px] font-semibold leading-7 text-white md:text-[22px]">One platform built around the way<br className="hidden sm:block"/> your business actually works.</p>
      <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-6 text-slate-400 md:text-base md:leading-7">Manage jobs, scheduling, clients, staff, quotes, invoices, timesheets, stock, documents, reminders, reporting and more — all from one place.</p>
      <div className="mx-auto mt-7 flex max-w-[440px] flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/contact" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#168dff] px-6 text-sm font-bold">Book a Demo <ArrowRight size={16}/></Link><Link href="/features" className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-white/15 bg-[#08101a] px-6 text-sm font-bold">See Features</Link></div>
      <DashboardPreview/>
      <div className="mt-5 pb-5 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">Powered by <span className="normal-case tracking-[-.04em]"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></span></div>
    </div>
  </section>
  <section className="border-y border-[#168dff]/30 bg-[#0a4d91]"><div className="mx-auto grid max-w-[1180px] grid-cols-4 md:grid-cols-8">{modules.map(([name,Icon])=><div key={name} className="flex min-h-[78px] flex-col items-center justify-center gap-2 border-r border-white/[.08] px-2 text-[11px] font-semibold text-white md:min-h-[86px] md:text-xs"><Icon size={17}/><span>{name}</span></div>)}</div></section>
  <section className="mx-auto max-w-[1180px] px-6 py-20 md:px-8 md:py-28"><div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#168dff]">Everything connected</p><h2 className="mt-4 text-4xl font-black uppercase leading-[1.02] tracking-[-.045em] md:text-5xl">RUN THE BUSINESS.<br/>NOT THE SOFTWARE.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 md:text-base">YourPlan connects the everyday parts of the operation so your team can work from one system instead of jumping between separate apps.</p></div><div className="grid gap-3 sm:grid-cols-2">{featureCards.slice(0,6).map(([name,text,Icon])=><div key={name} className="border border-white/[.08] bg-[#07101a] p-5"><Icon size={19} className="text-[#168dff]"/><h3 className="mt-4 font-bold">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></div></section>
</PublicShell>}

function DashboardPreview(){return <div className="relative mx-auto mt-11 max-w-[930px] pb-1 md:mt-14"><div className="pointer-events-none absolute inset-x-[8%] bottom-[-18px] top-[6%] bg-[#168dff]/20 blur-[70px]"/><div className="relative overflow-hidden border border-[#168dff]/30 bg-[#06101b] shadow-[0_25px_80px_rgba(0,0,0,.6)]"><div className="flex h-8 items-center border-b border-white/[.06] px-3"><span className="text-[9px] font-black tracking-[-.05em]"><span className="text-[#168dff]">your</span>plan</span></div><div className="grid grid-cols-[34px_1fr] md:grid-cols-[48px_1fr]"><aside className="border-r border-white/[.06] bg-[#040b13] py-3"><div className="space-y-3">{[0,1,2,3,4,5].map(i=><div key={i} className={`mx-auto h-3 w-3 rounded-sm ${i===0?"bg-[#168dff]":"bg-slate-700/70"}`}/>)}</div></aside><div className="p-3 md:p-5"><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{[["TOTAL JOBS","42"],["REVENUE","$124,580"],["QUOTES SENT","37"],["INVOICES PAID","28"]].map(([l,v])=><div key={l} className="border border-white/[.06] bg-[#091521] p-3 text-left"><p className="text-[7px] font-semibold tracking-[.12em] text-slate-500 md:text-[8px]">{l}</p><p className="mt-1 text-base font-black md:text-xl">{v}</p></div>)}</div><div className="mt-2 grid gap-2 md:grid-cols-[.8fr_1.2fr]"><div className="border border-white/[.06] bg-[#091521] p-3 text-left"><p className="text-[9px] font-bold text-slate-300">Job Overview</p><div className="mt-4 flex h-[90px] items-center justify-center"><div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[7px] border-[#168dff]/80"><div className="text-center"><div className="text-lg font-black">42</div><div className="text-[7px] text-slate-500">Total Jobs</div></div></div></div></div><div className="border border-white/[.06] bg-[#091521] p-3 text-left"><div className="flex items-center justify-between"><p className="text-[9px] font-bold text-slate-300">Revenue Overview</p><p className="text-[8px] text-[#168dff]">$24,680</p></div><div className="relative mt-5 h-[90px]"><div className="absolute inset-x-0 bottom-4 h-px bg-white/[.07]"/><div className="absolute inset-x-0 bottom-9 h-px bg-white/[.05]"/><div className="absolute inset-x-0 bottom-14 h-px bg-white/[.05]"/><svg viewBox="0 0 300 80" className="absolute inset-0 h-full w-full" preserveAspectRatio="none"><polyline points="0,65 35,58 70,61 105,42 140,47 175,31 210,38 245,20 300,26" fill="none" stroke="#168dff" strokeWidth="3"/></svg></div></div></div></div></div></div></div>}

const pageCopy = {
features:{eyebrow:"Features",title:"EVERYTHING YOUR BUSINESS NEEDS. ONE PLACE.",body:"Running a business shouldn’t mean jumping between five different systems. YourPlan brings the everyday parts of your business together in one platform."},
pricing:{eyebrow:"Pricing",title:"SIMPLE, TRANSPARENT PRICING.",body:"One business. One platform. One straightforward subscription."},
about:{eyebrow:"About",title:"BUILT AROUND THE WAY BUSINESSES ACTUALLY WORK.",body:"YourPlan exists to replace disconnected admin tools with one configurable operating system for everyday businesses."},
industries:{eyebrow:"Industries",title:"YOUR INDUSTRY. YOUR WORKFLOW. YOUR PLAN.",body:"The same YourPlan foundation can be configured for electrical, landscaping, mechanical, construction and other service businesses."},
resources:{eyebrow:"Resources",title:"HELP WHEN YOU NEED IT.",body:"Guides, onboarding material, workflow help and product updates for teams using YourPlan."},
contact:{eyebrow:"Contact",title:"LET’S BUILD YOUR PLAN.",body:"Show us how your business works and we’ll configure YourPlan around the way your team actually operates."}
} as const;

export function InfoPage({kind}:{kind:keyof typeof pageCopy}){const c=pageCopy[kind];return <PublicShell><section className="bg-[radial-gradient(circle_at_50%_0%,rgba(100,115,132,.25),transparent_30%),linear-gradient(180deg,#151d26,#03070d_58%)]"><div className="mx-auto max-w-[1180px] px-6 py-16 md:px-8 md:py-24"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#168dff]">{c.eyebrow}</p><h1 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[1] tracking-[-.05em] md:text-7xl">{c.title}</h1><p className="mt-6 max-w-3xl text-base leading-7 text-slate-400 md:text-lg md:leading-8">{c.body}</p>{kind==="features"&&<div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{featureCards.map(([name,text,Icon])=><div key={name} className="border border-white/[.08] bg-[#07101a] p-6"><Icon className="text-[#168dff]" size={20}/><h2 className="mt-5 font-bold">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div>}{kind==="pricing"&&<div className="mt-12 max-w-lg border border-[#168dff]/25 bg-[#07101a] p-7 md:p-9"><div className="flex items-end gap-2"><span className="text-6xl font-black text-[#168dff]">$50</span><span className="pb-2 text-xl font-semibold">/month</span></div><p className="mt-2 text-sm text-slate-400">One business. One platform.</p><div className="mt-7 space-y-3 text-sm text-slate-300"><p>✓ Standard YourPlan platform included</p><p>✓ $0 standard setup fee</p><p>✓ Your branding and colours</p><p>✓ Your selected standard modules</p><p>✓ Cancel anytime</p><p>✓ Free trial available on request</p><p>✓ Standard platform updates included</p></div><Link href="/contact" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-[#168dff] px-5 font-bold">Book a Demo <ArrowRight size={15}/></Link></div>}{kind==="contact"&&<div className="mt-10"><Link href="mailto:hello@your-plan.com.au" className="inline-flex items-center gap-2 rounded-lg bg-[#168dff] px-6 py-3 font-bold">Contact YourPlan <ArrowRight size={16}/></Link></div>}</div></section></PublicShell>}
