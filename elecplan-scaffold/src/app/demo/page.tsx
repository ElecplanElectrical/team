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

const modules = [
  ["Jobs", "24 active", BriefcaseBusiness],
  ["Calendar", "8 this week", CalendarDays],
  ["Clients", "126 records", Users],
  ["Quotes", "$42.8k pipeline", FileText],
  ["Invoices", "$18.4k outstanding", CircleDollarSign],
  ["Materials", "312 stock items", Package],
  ["Timesheets", "41.5 hrs this week", CheckCircle2],
  ["Reports", "Live business view", BarChart3],
] as const;

const jobs = [
  { title: "Front landscape renovation", client: "Sample Residence", time: "8:00 AM", status: "In progress" },
  { title: "Commercial maintenance", client: "Sample Commercial", time: "10:30 AM", status: "Scheduled" },
  { title: "Pool surround works", client: "Sample Residence", time: "1:00 PM", status: "Scheduled" },
];

const leads = [
  { name: "Garden redesign", value: "$8,900", stage: "Quoted" },
  { name: "Retaining wall", value: "$14,500", stage: "New" },
  { name: "Commercial grounds", value: "$22,000", stage: "Follow up" },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#04111e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-cyan-400/20 bg-[#07192b] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">YourPlan Demo</div>
            <h1 className="text-2xl font-semibold md:text-3xl">One place to run the whole business.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              This is a safe, read-only demonstration workspace using sample data. Real customer portals use the same YourPlan platform with their own branding, users, permissions and data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Customer login</Link>
            <span className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#04111e]">Live product demo</span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active jobs" value="24" note="6 in progress" />
          <Metric label="Quote pipeline" value="$42.8k" note="9 open quotes" />
          <Metric label="Receivables" value="$18.4k" note="3 overdue" />
          <Metric label="Team today" value="7" note="5 jobs scheduled" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Today&apos;s schedule</h2>
                <p className="mt-1 text-xs text-slate-500">Jobs, staff and timing in one view</p>
              </div>
              <CalendarDays size={18} className="text-cyan-300" />
            </div>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.title} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0a2036] p-4">
                  <div>
                    <div className="text-sm font-medium">{job.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{job.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-cyan-200">{job.time}</div>
                    <div className="mt-1 text-xs text-slate-500">{job.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5">
            <h2 className="font-semibold">Lead pipeline</h2>
            <p className="mt-1 text-xs text-slate-500">Keep sales work moving</p>
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
          <div className="mb-4">
            <h2 className="font-semibold">YourPlan modules</h2>
            <p className="mt-1 text-xs text-slate-500">Turn modules on per customer without rebuilding the platform.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(([name, meta, Icon]) => (
              <div key={name} className="rounded-xl border border-white/5 bg-[#0a2036] p-4">
                <Icon size={18} className="mb-3 text-cyan-300" />
                <div className="text-sm font-semibold">{name}</div>
                <div className="mt-1 text-xs text-slate-500">{meta}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-5 flex flex-col gap-2 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <span><strong className="text-white">YourPlan</strong> — one platform, configured around the way each business actually works.</span>
          <span className="text-xs text-slate-500">Demo data only · no real customer information</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07192b] p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-cyan-300">{note}</div>
    </div>
  );
}
