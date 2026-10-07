import { BookOpen, FileText, ShieldCheck, Zap, ExternalLink, Search } from "lucide-react";
import { requireAccess } from "@/lib/session";

const references = [
  {
    title: "AS/NZS 3000 — Wiring Rules",
    description: "Main wiring rules reference for electrical installations. Keep the licensed copy here for quick site access.",
    icon: Zap,
    status: "Reference",
  },
  {
    title: "AS/NZS 3008 — Cable Selection",
    description: "Cable current-carrying capacity, voltage drop and installation-condition reference.",
    icon: FileText,
    status: "Reference",
  },
  {
    title: "AS/NZS 4836 — Safe Working",
    description: "Safe working on or near low-voltage electrical installations and equipment.",
    icon: ShieldCheck,
    status: "Reference",
  },
  {
    title: "Victorian Rules & ESV",
    description: "Victorian electrical safety requirements, certificates, licensing guidance and ESV references.",
    icon: BookOpen,
    status: "Victoria",
  },
];

const quickReference = [
  "Common Wiring Rules clauses and where to find them",
  "Cable selection tables and voltage-drop references",
  "RCD, MEN and earthing quick-reference notes",
  "Testing sequence and verification checklist",
  "Wet areas, bathrooms and zone references",
  "Switchboards, protection and circuit requirements",
];

export default async function RegsPage() {
  await requireAccess("regs");

  return <div className="min-h-full bg-[#0d1117] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1300px]">
      <div className="mb-7 border-b border-white/10 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#43D2FF]">
          <BookOpen size={16}/> Elecplan
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Regs & Standards</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          One place for the Elecplan team to get to the Wiring Rules, cable-selection references, safe-working standards and Victorian electrical requirements on site.
        </p>
      </div>

      <div className="mb-7 rounded-2xl border border-[#43D2FF]/20 bg-[#43D2FF]/[0.06] p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#43D2FF] text-[#06213a]">
            <Search size={19}/>
          </div>
          <div>
            <h2 className="font-bold">Built for quick site lookups</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              This section will hold Elecplan&apos;s licensed standards documents and our own quick-reference notes. It won&apos;t copy or republish standards text we don&apos;t have rights to distribute.
            </p>
          </div>
        </div>
      </div>

      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Standards library</p>
        <div className="grid gap-3 md:grid-cols-2">
          {references.map((item) => {
            const Icon = item.icon;
            return <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-[#111923] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#7ce2ff]">
                  <Icon size={21}/>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{item.title}</h2>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <ExternalLink size={13}/> Licensed document/link to be connected
                  </div>
                </div>
              </div>
            </div>;
          })}
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Elecplan quick reference</p>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111923] p-5 sm:p-6">
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            This is where we can build the apprentice-friendly version: fast navigation, clause locations, checklists and Elecplan notes that point the electrician to the correct standard.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickReference.map((item) => <div key={item} className="rounded-xl border border-white/[0.07] bg-black/15 p-4 text-sm font-semibold leading-5 text-slate-300">
              {item}
            </div>)}
          </div>
        </div>
      </section>
    </div>
  </div>;
}
