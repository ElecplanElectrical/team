import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers3,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { firstAccessibleModulePath } from "@/lib/access";
import DemoLaunchButton from "@/components/DemoLaunchButton";

const modules = [
  ["Jobs", "Plan, assign and track work", BriefcaseBusiness],
  ["Leads & CRM", "Keep every opportunity moving", Users],
  ["Calendar", "Schedule the whole operation", CalendarDays],
  ["Quotes", "Build and follow up quotes", FileText],
  ["Invoices", "Keep receivables visible", WalletCards],
  ["Team", "Users, roles and permissions", Users],
  ["Timesheets", "Capture hours without the mess", CheckCircle2],
  ["Documents", "Keep business files together", FileText],
  ["Materials", "Stock and job materials", Package],
  ["Inspections", "Checklists that stay with the job", ClipboardCheck],
  ["Reports", "See the business clearly", BarChart3],
  ["Automation", "Reduce repetitive admin", Sparkles],
] as const;

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    if (!user.businessId && user.role === "ADMIN") redirect("/platform");
    if (user.business) redirect(firstAccessibleModulePath(user.role, user.business.modules));
    redirect("/account");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030b14] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_50%_5%,rgba(133,153,175,.22),transparent_36%),radial-gradient(circle_at_82%_28%,rgba(22,141,255,.16),transparent_28%),linear-gradient(180deg,#101923_0%,#07111d_48%,#030b14_100%)]" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link href="/demo" className="hidden rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:block">Demo</Link>
          <Link href="/login?callbackUrl=/platform" className="hidden rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white md:block">YourPlan HQ</Link>
          <Link href="/login" className="rounded-full border border-white/12 bg-white/[.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[.08]">Sign in</Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-14 text-center md:px-8 md:pb-20 md:pt-24">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[.18em] text-cyan-200">
          <Layers3 size={14} /> One platform. Built around your business.
        </div>
        <h1 className="mx-auto mt-7 max-w-6xl text-balance text-5xl font-bold tracking-[-.055em] sm:text-6xl md:text-7xl lg:text-[86px] lg:leading-[.98]">
          <span className="text-[#168dff]">Your</span> Business. <span className="text-[#168dff]">Your</span> Way. <span className="text-[#168dff]">Your</span> Plan.
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-balance text-base leading-7 text-slate-300 md:text-lg md:leading-8">
          Jobs, leads, scheduling, quoting, invoicing, staff, timesheets, stock, documents, reporting and automation — brought into one configurable business platform.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <DemoLaunchButton label="Explore the live demo" />
          <Link href="/login" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.04] px-6 text-sm font-semibold text-white transition hover:bg-white/[.08]">
            Business login <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span>One platform</span><span className="h-1 w-1 rounded-full bg-slate-600"/><span>One subscription</span><span className="h-1 w-1 rounded-full bg-slate-600"/><span>Configured for each business</span>
        </div>

        <LivePreview />
      </section>

      <section className="relative z-10 border-y border-white/[.07] bg-[#05101b]/90">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-3 md:px-8 md:py-10">
          <Proof icon={<ShieldCheck size={18}/>} title="One secure foundation" text="Every customer runs on the same YourPlan core with separate users, permissions, branding and business data." />
          <Proof icon={<Layers3 size={18}/>} title="Configured, not rebuilt" text="Turn modules on or off and shape the portal around the way each company actually operates." />
          <Proof icon={<Sparkles size={18}/>} title="Less admin" text="Bring repetitive workflows, reminders and future automation into the same place as the work itself." />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#25c7ff]">Everything in one place</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] md:text-5xl">Stop stitching your business together with five different systems.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">YourPlan gives everyday businesses one clean workspace, while still allowing the modules, workflows, permissions and branding to fit the business behind it.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map(([name, text, Icon]) => (
            <div key={name} className="group rounded-2xl border border-white/[.08] bg-[#071522] p-5 transition hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-[#081a2a]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#168dff]/10 text-[#25c7ff]"><Icon size={18}/></span>
              <h3 className="mt-5 text-sm font-semibold">{name}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <div className="overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_15%_20%,rgba(22,141,255,.20),transparent_30%),linear-gradient(135deg,#0b1c2e,#06111d)] p-7 md:p-12">
          <div className="grid gap-9 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-200">See it working</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-.04em] md:text-5xl">The showcase is only the front door. The demo is the actual product.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">Open the interactive YourPlan demo tenant and move through the same core portal architecture used for customer businesses. The demo uses fictional data and is locked read-only.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <DemoLaunchButton label="Open interactive demo" />
              <Link href="/login?callbackUrl=/platform" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 px-5 text-sm font-semibold text-white hover:bg-white/[.05]">YourPlan HQ <ArrowRight size={15}/></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[.07] bg-[#020811]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div><Wordmark /><p className="mt-2 text-xs text-slate-600">One place to run your business.</p></div>
          <div className="flex flex-wrap gap-5 text-xs text-slate-500"><Link href="/demo" className="hover:text-white">Demo</Link><Link href="/login" className="hover:text-white">Customer login</Link><Link href="/login?callbackUrl=/platform" className="hover:text-white">YourPlan HQ</Link></div>
        </div>
      </footer>
    </main>
  );
}

function Wordmark() {
  return <div aria-label="Your Plan" className="text-[24px] font-black tracking-[-.075em]"><span className="text-[#168dff]">your</span><span className="text-white"> plan</span></div>;
}

function LivePreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-6xl md:mt-18">
      <div className="pointer-events-none absolute -inset-10 rounded-[50px] bg-[radial-gradient(circle_at_50%_25%,rgba(22,141,255,.30),rgba(37,199,255,.07)_35%,transparent_68%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#061321] p-2 shadow-[0_35px_120px_rgba(0,0,0,.52)] md:rounded-[30px] md:p-3">
        <div className="mb-2 flex items-center justify-between px-2 py-1.5 md:px-3">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20"/><span className="h-2 w-2 rounded-full bg-white/15"/><span className="h-2 w-2 rounded-full bg-white/10"/></div>
          <span className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-600">Live YourPlan product preview</span>
        </div>
        <div className="relative aspect-[16/9.7] overflow-hidden rounded-[18px] bg-[#04111e] md:rounded-[22px]">
          <iframe src="/demo" title="YourPlan live demo preview" tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 border-0" style={{width:"138.89%",height:"138.89%",transform:"scale(.72)",transformOrigin:"top left"}} />
          <Link href="/demo" aria-label="Open YourPlan demo" className="absolute inset-0 z-10" />
        </div>
      </div>
    </div>
  );
}

function Proof({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) {
  return <div className="flex gap-4"><span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] text-cyan-300">{icon}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></div></div>;
}
