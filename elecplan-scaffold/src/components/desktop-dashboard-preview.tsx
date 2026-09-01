const blue = "#168dff";

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

function MiniLine({ wide = false }: { wide?: boolean }) {
  return <svg viewBox="0 0 160 28" className={wide ? "h-7 w-full" : "h-5 w-full"} aria-hidden="true"><polyline points="0,23 18,20 34,21 48,16 65,18 82,14 100,15 116,9 133,11 150,5 160,7" fill="none" stroke={blue} strokeWidth="2" /></svg>;
}

export function DesktopDashboardPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[16px] border border-[#168dff]/35 bg-[#080d12] shadow-[0_0_28px_rgba(22,141,255,.55),0_24px_70px_rgba(0,0,0,.52)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.03),transparent_38%)]" />
      <div className="relative flex h-full">
        <aside className="w-[18.7%] border-r border-white/[.07] bg-[#070b0f] px-[14px] py-[14px]">
          <ExactYourPlanLogo small />
          <div className="mt-5 space-y-[6px] text-[9px] text-slate-300">
            {["Dashboard","Jobs","Leads & CRM","Quotes","Invoices","Calendar","Staff","Timesheets","Documents","Stock","Reminders","Reporting","AI & Automation"].map((item, i) => (
              <div key={item} className={`flex h-[21px] items-center gap-2 rounded px-2 ${i === 0 ? "bg-[#0b3763] text-white" : ""}`}>
                <span className={`h-2.5 w-2.5 rounded-[2px] border ${i === 0 ? "border-[#168dff]" : "border-white/45"}`} /><span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
        <section className="flex-1 px-[15px] py-[15px]">
          <div className="flex items-center justify-between"><h3 className="text-[15px] font-semibold">Dashboard</h3><div className="text-[8px] text-slate-400">May 12 – May 18, 2025</div></div>
          <div className="mt-4 grid grid-cols-4 gap-[10px]">
            {[["Total Jobs","42"],["Revenue","$124,580"],["Quotes Sent","37"],["Invoices Paid","28"]].map(([label,value]) => <div key={label} className="h-[88px] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[9px] text-slate-300">{label}</div><div className="mt-1 text-[18px] font-semibold">{value}</div><div className="mt-2"><MiniLine /></div></div>)}
          </div>
          <div className="mt-3 grid grid-cols-[.92fr_1.45fr] gap-[10px]">
            <div className="h-[142px] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[10px]">Job Overview</div><div className="mt-4 flex items-center gap-5"><div className="flex h-[78px] w-[78px] items-center justify-center rounded-full border-[11px] border-[#168dff] border-r-[#1b2631] border-b-[#1b2631]"><div className="text-center"><div className="text-[19px]">42</div><div className="text-[8px] text-slate-400">Total Jobs</div></div></div><div className="space-y-2 text-[8px] text-slate-300"><div>In Progress 18</div><div>Completed 16</div><div>Scheduled 6</div><div>Pending 2</div></div></div></div>
            <div className="h-[142px] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3"><div className="text-[10px]">Revenue Overview</div><div className="mt-7"><MiniLine wide /></div></div>
          </div>
          <div className="mt-3 grid grid-cols-[1.18fr_1fr] gap-[10px]"><div className="h-[95px] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[8px]"><div className="mb-2 text-[10px]">Upcoming Jobs</div><div>Kitchen Renovation <span className="float-right rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Today</span></div><div className="mt-3">Bathroom Fitout <span className="float-right rounded bg-[#0c3761] px-2 py-1 text-[#65adff]">Tomorrow</span></div></div><div className="h-[95px] rounded-[7px] border border-white/[.08] bg-[#0b1015] p-3 text-[8px] text-slate-300"><div className="mb-2 text-[10px] text-white">Recent Activity</div><div className="space-y-2"><div>Invoice paid <span className="float-right">2m ago</span></div><div>New quote sent <span className="float-right">15m ago</span></div><div>Job updated <span className="float-right">32m ago</span></div></div></div></div>
        </section>
      </div>
    </div>
  );
}
