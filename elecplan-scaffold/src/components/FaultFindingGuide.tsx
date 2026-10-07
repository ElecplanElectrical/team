"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, CircleCheck, Search, ShieldCheck, Zap } from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  description: string;
  checks: Array<{ title: string; detail: string }>;
  finish: string;
};

const scenarios: Scenario[] = [
  {
    id: "rcd",
    title: "RCD / RCBO trips or will not reset",
    description: "Work out whether the fault is in an appliance/load, the fixed wiring, or the protective device.",
    checks: [
      { title: "Remove downstream loads", detail: "Unplug portable equipment and switch connected loads off where practical. Do not keep repeatedly resetting into a known fault." },
      { title: "Inspect before testing", detail: "Look for moisture, damaged fittings, heat, recent building work, crushed cables, outdoor equipment and obvious neutral-to-earth issues." },
      { title: "Separate the circuit", detail: "With the circuit safely isolated and proven dead, disconnect or divide downstream sections methodically so the fault can be narrowed to a section." },
      { title: "Test the isolated wiring", detail: "Carry out the required de-energised insulation-resistance and continuity tests using the correct procedure and equipment for the installation." },
      { title: "Reconnect in stages", detail: "Once the fixed wiring tests correctly, reconnect loads one at a time to identify equipment that causes the trip." },
    ],
    finish: "Before return to service, confirm protection operates correctly and complete the required verification tests.",
  },
  {
    id: "breaker",
    title: "Circuit breaker trips under load",
    description: "Separate an overload problem from a short-circuit, loose connection or equipment fault.",
    checks: [
      { title: "Check what was running", detail: "Record the loads connected when the trip occurs and compare the expected demand with the circuit and protective-device rating." },
      { title: "Inspect terminations", detail: "After isolation and proving dead, inspect the board, accessories and high-load equipment for heat damage, loose terminations or discolouration." },
      { title: "Add loads progressively", detail: "Reconnect known-good loads in stages so the point at which the problem appears can be identified." },
      { title: "Confirm circuit suitability", detail: "Check the cable installation conditions, protection and connected load are suitable for the circuit design." },
      { title: "Measure only when justified", detail: "If live current measurement is genuinely required, it must be done by a competent electrician under the appropriate live-work controls." },
    ],
    finish: "Do not uprate a breaker simply to stop tripping. Find and correct the cause first.",
  },
  {
    id: "no-power",
    title: "No power to a circuit",
    description: "Find the first point where supply is lost without randomly pulling the whole installation apart.",
    checks: [
      { title: "Confirm the extent", detail: "Establish whether the whole circuit is dead or only part of it. Check which nearby points are still operating." },
      { title: "Check upstream protection", detail: "Confirm the relevant protective device and upstream supply condition before opening accessories." },
      { title: "Isolate and prove dead", detail: "Use the normal safe-isolation process before inspecting terminations or carrying out continuity work." },
      { title: "Work from known-good to dead", detail: "Follow the circuit from the last known-good point toward the first dead point. Loose loop terminations are common causes." },
      { title: "Verify the repair", detail: "After correcting the fault, complete the appropriate verification tests before energising and function-test the circuit." },
    ],
    finish: "Document the fault location and repair so the next electrician is not starting from zero.",
  },
  {
    id: "light",
    title: "Light not working / intermittent",
    description: "Separate fitting, driver, dimmer, switching and wiring faults.",
    checks: [
      { title: "Start with the fitting", detail: "Check the lamp, LED driver or fitting condition and look for heat damage, water ingress or obvious failure." },
      { title: "Check controls", detail: "Confirm the switch, sensor, relay or dimmer is compatible with the load and is not showing signs of failure." },
      { title: "Inspect connections", detail: "With the circuit isolated and proven dead, inspect active, neutral and earth terminations at the switch, fitting and accessible junctions." },
      { title: "Test the path", detail: "Use continuity and other appropriate de-energised tests to confirm the switched active, neutral and protective conductor path." },
      { title: "Look for intermittent causes", detail: "Pay attention to loose conductors, failed drivers, overheating components and movement-sensitive joints." },
    ],
    finish: "Once repaired, function-test all associated switching and controls.",
  },
  {
    id: "gpo",
    title: "GPO / outlet has no power",
    description: "Use nearby outlets to narrow down where a socket circuit has opened.",
    checks: [
      { title: "Map the affected points", detail: "Find the last working outlet and the first dead outlet on the circuit if the physical route is known." },
      { title: "Check protection", detail: "Confirm the RCD/RCBO or breaker condition and whether other circuits are affected." },
      { title: "Isolate and inspect", detail: "After proving dead, inspect loop terminals and conductors at the last working and first dead accessories." },
      { title: "Continuity test", detail: "Use appropriate de-energised continuity testing to identify an open active, neutral or protective conductor." },
      { title: "Repair and verify", detail: "Correct the termination or cable fault and complete the required testing before re-energising." },
    ],
    finish: "If heat damage is present, assess the accessory and conductor condition rather than just tightening the terminal.",
  },
  {
    id: "intermittent",
    title: "Intermittent / nuisance fault",
    description: "Capture the conditions that make a fault appear instead of guessing.",
    checks: [
      { title: "Get the history", detail: "Record when it happens, weather conditions, appliances in use, recent work and whether vibration or heat is involved." },
      { title: "Inspect likely areas", detail: "Check outdoor equipment, roof spaces, damp locations, high-load connections and anything recently altered." },
      { title: "Test isolated sections", detail: "Divide the installation methodically and use the appropriate de-energised tests to compare sections." },
      { title: "Check shared connections", detail: "Pay special attention to neutrals, shared circuits, loose common connections and control wiring." },
      { title: "Record what you found", detail: "If the fault cannot be reproduced, leave useful measurements and observations for the next visit instead of a vague note." },
    ],
    finish: "Intermittent faults are usually solved faster by good records and section-by-section testing than by swapping random parts.",
  },
];

export default function FaultFindingGuide() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];

  return <div className="min-h-full bg-[#0d1117] px-4 py-5 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1300px]">
      <div className="mb-6 border-b border-white/10 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#43D2FF]">
          <Search size={16}/> Elecplan Tools
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Fault Finding Guide</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          A structured starting point for common electrical faults so the team works methodically instead of guessing.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-amber-300" size={20}/>
          <p className="text-sm leading-6 text-amber-100/85">
            For competent, authorised electrical workers. Use safe isolation, prove de-energised before opening or disconnecting equipment, and follow the applicable Victorian requirements and safe-working procedures. Live testing should only be used where justified and with the required controls.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#111923] p-3">
          <div className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.13em] text-slate-500">What is the fault?</div>
          <div className="space-y-2">
            {scenarios.map((item) => <button
              type="button"
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-[#43D2FF]/40 bg-[#43D2FF]/10" : "border-white/[0.06] bg-black/10 hover:bg-white/[0.04]"}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selectedId === item.id ? "bg-[#43D2FF] text-[#06213a]" : "bg-white/[0.05] text-slate-400"}`}>
                <Zap size={17}/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-100">{item.title}</div>
              </div>
              <ChevronRight size={16} className={selectedId === item.id ? "text-[#43D2FF]" : "text-slate-600"}/>
            </button>)}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111923] p-5 sm:p-6">
          <div className="mb-5">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#43D2FF]/20 bg-[#43D2FF]/[0.07] px-3 py-1 text-xs font-bold text-[#7ce2ff]">
              <AlertTriangle size={13}/> Guided fault finding
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">{selected.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{selected.description}</p>
          </div>

          <div className="space-y-3">
            {selected.checks.map((check, index) => <div key={check.title} className="flex gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#43D2FF] text-xs font-black text-[#06213a]">{index + 1}</div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{check.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">{check.detail}</p>
              </div>
            </div>)}
          </div>

          <div className="mt-5 flex gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
            <CircleCheck className="mt-0.5 shrink-0 text-emerald-300" size={19}/>
            <p className="text-sm leading-6 text-emerald-100/85">{selected.finish}</p>
          </div>
        </section>
      </div>
    </div>
  </div>;
}
