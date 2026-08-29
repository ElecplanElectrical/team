import { notFound } from "next/navigation";
import { Building2, CircleDollarSign, Power, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import TopBar from "@/components/TopBar";
import BusinessPortalForm from "@/components/BusinessPortalForm";
import BusinessPortalManager from "@/components/BusinessPortalManager";

const UI={panel:"#07192b",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",cyan:"#25c7ff"};
export default async function PlatformPage(){
 const user=await getPlatformAdmin(); if(!user) notFound();
 const rows=await prisma.businessPortal.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{users:true,clients:true,jobs:true}}}});
 const active=rows.filter(b=>b.active); const mrr=active.reduce((sum,b)=>sum+Number(b.monthlyPrice??0),0); const seats=rows.reduce((sum,b)=>sum+b._count.users,0);
 const businesses=rows.map(b=>({...b,monthlyPrice:b.monthlyPrice===null?null:Number(b.monthlyPrice)}));
 return <><TopBar title="Your Plan HQ" subtitle="Customers, subscriptions, access and portal configuration"/><main className="flex-1 overflow-auto p-4 md:p-6" style={{background:"#03101f"}}><div className="mx-auto max-w-7xl space-y-4">
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Building2 size={17}/>} label="Customer businesses" value={String(rows.length)}/><Metric icon={<Power size={17}/>} label="Active subscriptions" value={String(active.length)}/><Metric icon={<CircleDollarSign size={17}/>} label="Monthly recurring" value={new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",maximumFractionDigits:0}).format(mrr)}/><Metric icon={<Users size={17}/>} label="Customer users" value={String(seats)}/></section>
 <BusinessPortalForm/><BusinessPortalManager businesses={businesses}/>
 </div></main></>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center gap-2 text-xs" style={{color:UI.mute}}><span style={{color:UI.cyan}}>{icon}</span>{label}</div><div className="mt-2 text-2xl font-semibold" style={{color:UI.text}}>{value}</div></div>}
