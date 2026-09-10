import Link from "next/link";
import { notFound } from "next/navigation";
import { MonitorPlay, Plus, Bike, ArrowUpRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import { getPlatformAdmin } from "@/lib/platform-admin";

const UI={panel:"var(--brand-panel, #07192b)",border:"var(--brand-border, rgba(77,150,221,.24))",text:"#f5f9ff",mute:"var(--brand-muted, #93a9c2)",faint:"var(--brand-faint, #617993)",cyan:"var(--brand-accent, #25c7ff)"};

export default async function DemoViewerPage(){
 const user=await getPlatformAdmin();if(!user)notFound();
 return <><TopBar title="Client Demos" subtitle="Build, preview and present branded portals"/><main className="flex-1 overflow-auto p-4 md:p-6" style={{background:"var(--app-bg, #03101f)"}}><div className="mx-auto max-w-7xl space-y-5">
  <section className="flex flex-col gap-3 rounded-xl p-5 md:flex-row md:items-center md:justify-between" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div><div className="flex items-center gap-2"><MonitorPlay size={20} style={{color:UI.cyan}}/><h1 className="text-lg font-semibold" style={{color:UI.text}}>Demo Viewer</h1></div><p className="mt-2 max-w-2xl text-sm leading-6" style={{color:UI.mute}}>Keep client demos separate from live customer portals. Open a demo full-screen during a meeting, click through every module, then turn the approved setup into a real customer portal later.</p></div><Link href="/hq/templates" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{background:UI.cyan,color:"#03101f"}}><Plus size={16}/>New demo</Link></section>

  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
   <article className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="h-2 bg-[#69be28]"/><div className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Bike size={18} className="text-[#69be28]"/><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69be28]">Race team demo</p></div><h2 className="mt-2 text-xl font-semibold" style={{color:UI.text}}>Penrite Racing Empire Kawasaki</h2><p className="mt-2 text-sm" style={{color:UI.mute}}>Empire HQ · private presentation build</p></div><span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{background:"rgba(105,190,40,.12)",color:"#8fe35c",border:"1px solid rgba(105,190,40,.35)"}}>Demo</span></div>
   <div className="mt-5 grid grid-cols-3 gap-2 text-center"><Stat value="3" label="Riders"/><Stat value="9" label="Core modules"/><Stat value="Private" label="Access"/></div>
   <div className="mt-5 flex gap-2"><Link href="/hq/demos/empire" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold" style={{background:"#69be28",color:"#061008"}}>Open demo <ArrowUpRight size={15}/></Link><Link href="/hq/templates" className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{border:`1px solid ${UI.border}`,color:UI.text}}>Template</Link></div></div></article>
  </section>
 </div></main></>
}

function Stat({value,label}:{value:string;label:string}){return <div className="rounded-lg px-2 py-3" style={{background:"rgba(255,255,255,.025)",border:`1px solid ${UI.border}`}}><div className="text-sm font-semibold" style={{color:UI.text}}>{value}</div><div className="mt-1 text-[11px]" style={{color:UI.faint}}>{label}</div></div>}
