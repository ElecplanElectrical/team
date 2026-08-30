import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Package,
  Users,
} from "lucide-react";
import DemoLaunchButton from "@/components/DemoLaunchButton";

const modules = [
  ["Jobs", "3 sample jobs", BriefcaseBusiness],
  ["Calendar", "2 live bookings", CalendarDays],
  ["Clients", "3 fictional records", Users],
  ["Quotes", "$30.3k quoted", FileText],
  ["Invoices", "$10.3k outstanding", CircleDollarSign],
  ["Materials", "3 stock items", Package],
  ["Timesheets", "2 team entries", CheckCircle2],
  ["Reports", "Live business view", BarChart3],
] as const;

const jobs = [
  { title: "Office upgrade works", client: "Oak & Co Offices", time: "Today", status: "In progress" },
  { title: "Front property renovation", client: "Riverside Residence", time: "Tomorrow", status: "Scheduled" },
  { title: "Maintenance inspection", client: "Northside Property Group", time: "Completed", status: "Complete" },
];

const leads = [
  { name: "Commercial maintenance program", value: "$12,500", stage: "New" },
  { name: "Front property renovation", value: "$8,900", stage: "Quoted" },
  { name: "Office upgrade works", value: "$21,400", stage: "Won" },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#04111e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-cyan-400/20 bg-[#07192b] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">YourPlan Demo</div>
            <h1 className="text-2xl font-semibold md:text-3xl">See the platform before you sign up.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              This public showcase mirrors the fictional records loaded into the real YourPlan demo tenant. Enter the workspace to move through the actual product. The demo is read-only and contains no customer data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DemoLaunchButton label="Enter interactive demo" />
            <Link href="/" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5">Back to website</Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Sample jobs" value="3" note="1 in progress" />
          <Metric label="Quote pipeline" value="$30.3k" note="2 open / accepted quotes" />
          <Metric label="Receivables" value="$10.3k" note="1 overdue" />
          <Metric label="Demo team" value="3" note="Admin + 2 staff" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="font-semibold">Demo schedule</h2><p className="mt-1 text-xs text-slate-500">Fictional jobs from the live demo tenant</p></div>
              <CalendarDays size={18} className="text-cyan-300" />
            </div>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.title} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0a2036] p-4">
                  <div><div className="text-sm font-medium">{job.title}</div><div className="mt-1 text-xs text-slate-500">{job.client}</div></div>
                  <div className="text-right"><div className="text-sm text-cyan-200">{job.time}</div><div className="mt-1 text-xs text-slate-500">{job.status}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5">
            <h2 className="font-semibold">Lead pipeline</h2><p className="mt-1 text-xs text-slate-500">Sample opportunities only</p>
            <div className="mt-4 space-y-3">
              {leads.map((lead) => (
                <div key={lead.name} className="rounded-xl bg-[#0a2036] p-4">
                  <div className="flex justify-between gap-3 text-sm"><span>{lead.name}</span><span className="font-semibold">{lead.value}</span></div>
                  <div className="mt-2 text-xs text-cyan-300">{lead.stage}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-[#07192b] p-5">
          <div className="mb-4"><h2 className="font-semibold">Inside the demo</h2><p className="mt-1 text-xs text-slate-500">These are real YourPlan modules, backed by an isolated demo tenant.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(([name, meta, Icon]) => (
              <div key={name} className="rounded-xl border border-white/5 bg-[#0a2036] p-4"><Icon size={18} className="mb-3 text-cyan-300"/><div className="text-sm font-semibold">{name}</div><div className="mt-1 text-xs text-slate-500">{meta}</div></div>
            ))}
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[.05] p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-semibold">Ready to click through the real workspace?</h2><p className="mt-1 text-xs text-slate-400">One click signs you into the isolated read-only demo tenant.</p></div>
          <DemoLaunchButton label="Launch YourPlan demo" />
        </section>

        <footer className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#07192b] p-5 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <span><strong className="text-white">YourPlan</strong> — one platform, configured around the way each business actually works.</span>
          <span className="text-xs text-slate-500">Fictional demo data only · read-only workspace</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-cyan-300">{note}</div></div>;
}
