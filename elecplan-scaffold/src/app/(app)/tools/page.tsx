import Link from "next/link";
import { Calculator, ChevronRight, Ruler } from "lucide-react";
import { requireAccess } from "@/lib/session";

const plannedTools = [
  { name: "Voltage Drop", description: "Cable voltage-drop helper for common site calculations." },
  { name: "Cable Sizing", description: "Quick cable-selection workflow with installation inputs." },
  { name: "Conduit Fill", description: "Check conduit capacity before you pull the run." },
  { name: "Load Calculator", description: "Fast current and load calculations for site work." },
];

export default async function ToolsPage() {
  await requireAccess("tools");

  return <div className="min-h-full bg-[#0d1117] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1300px]">
      <div className="mb-7 border-b border-white/10 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#43D2FF]"><Ruler size={16}/> Elecplan</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tools</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Site calculators and layout tools for the Elecplan team. Built to give apprentices and electricians the same repeatable method every time.</p>
      </div>

      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Available now</p>
        <Link href="/tools/downlight-planner" className="group flex max-w-3xl items-center gap-4 rounded-2xl border border-[#43D2FF]/25 bg-[#43D2FF]/[0.07] p-5 transition hover:border-[#43D2FF]/50 hover:bg-[#43D2FF]/[0.1]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#43D2FF] text-[#06213a]"><Ruler size={23}/></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">Downlight Planner</h2><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Live</span></div>
            <p className="mt-1 text-sm leading-6 text-slate-400">Enter room measurements, rows and columns, wall offsets and a starting point. Get a dimensioned plan plus a point-to-point marking sequence.</p>
          </div>
          <ChevronRight className="shrink-0 text-[#43D2FF] transition group-hover:translate-x-1" size={20}/>
        </Link>
      </section>

      <section className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Planned tools</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {plannedTools.map((tool) => <div key={tool.name} className="rounded-2xl border border-white/[0.08] bg-[#111923] p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400"><Calculator size={19}/></div>
            <div className="flex items-center gap-2"><h3 className="font-bold">{tool.name}</h3><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Planned</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{tool.description}</p>
          </div>)}
        </div>
      </section>
    </div>
  </div>;
}
