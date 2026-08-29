import { notFound } from "next/navigation";
import { Building2, CircleDollarSign, Layers3, Power } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import TopBar from "@/components/TopBar";
import BusinessPortalForm from "@/components/BusinessPortalForm";

const UI={panel:"#07192b",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",faint:"#617993",cyan:"#25c7ff",green:"#18d3a0"};
export default async function PlatformPage(){
 const user=await getPlatformAdmin(); if(!user) notFound();
 const businesses=await prisma.businessPortal.findMany({orderBy:{createdAt:"desc"}});
 const active=businesses.filter(b=>b.active);
 const mrr=active.reduce((sum,b)=>sum+Number(b.monthlyPrice??0),0);
 return <><TopBar title="Your Plan Platform" subtitle="Create, brand and manage customer business portals"/><main className="flex-1 overflow-auto p-4 md:p-6" style={{background:"#03101f"}}><div className="mx-auto max-w-7xl space-y-4">
 <section className="grid gap-3 sm:grid-cols-3"><Metric icon={<Building2 size={17}/>} label="Businesses" value={String(businesses.length)}/><Metric icon={<Power size={17}/>} label="Active subscriptions" value={String(active.length)}/><Metric icon={<CircleDollarSign size={17}/>} label="Monthly recurring" value={new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",maximumFractionDigits:0}).format(mrr)}/></section>
 <BusinessPortalForm/>
 <section className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:UI.border}}><div><h2 className="text-sm font-semibold" style={{color:UI.text}}>Customer portals</h2><p className="mt-1 text-xs" style={{color:UI.faint}}>Your Plan businesses and their enabled modules.</p></div><Layers3 size={18} style={{color:UI.cyan}}/></div>{businesses.length===0?<div className="px-5 py-12 text-center text-sm" style={{color:UI.mute}}>No customer businesses yet. Create the first one above.</div>:<div className="divide-y" style={{borderColor:UI.border}}>{businesses.map(b=>{const modules=Array.isArray(b.modules)?b.modules.map(String):[];return <div key={b.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center" style={{borderColor:UI.border}}><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:b.active?UI.green:"#617993"}}/><p className="font-semibold" style={{color:UI.text}}>{b.name}</p></div><p className="mt-1 text-xs" style={{color:UI.faint}}>{b.industry||"General business"} · /{b.slug}</p></div><div><p className="text-[10px] uppercase tracking-wider" style={{color:UI.faint}}>Plan</p><p className="mt-1 text-sm" style={{color:UI.text}}>{b.plan}</p></div><div><p className="text-[10px] uppercase tracking-wider" style={{color:UI.faint}}>Modules</p><p className="mt-1 text-sm" style={{color:UI.text}}>{modules.length} enabled</p></div><div className="text-right text-sm font-semibold" style={{color:UI.cyan}}>{b.monthlyPrice?`$${Number(b.monthlyPrice).toFixed(0)}/mo`:"Custom"}</div></div>})}</div>}</section>
 </div></main></>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center gap-2 text-xs" style={{color:UI.mute}}><span style={{color:UI.cyan}}>{icon}</span>{label}</div><div className="mt-2 text-2xl font-semibold" style={{color:UI.text}}>{value}</div></div>}
