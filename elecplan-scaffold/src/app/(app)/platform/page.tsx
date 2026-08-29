import { notFound } from "next/navigation";
import { Activity, Building2, CircleDollarSign, Power, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import TopBar from "@/components/TopBar";
import BusinessPortalForm from "@/components/BusinessPortalForm";
import BusinessPortalManager from "@/components/BusinessPortalManager";

const UI={panel:"#07192b",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",faint:"#617993",cyan:"#25c7ff",green:"#18d3a0"};
function activityLabel(action:string){if(action==="PLATFORM_CUSTOMER_CREATED")return"Customer created";if(action==="PLATFORM_CUSTOMER_UPDATED")return"Customer updated";return action.replaceAll("_"," ").toLowerCase()}
function businessName(details:unknown){if(details&&typeof details==="object"&&!Array.isArray(details)&&"businessName" in details){const name=(details as {businessName?:unknown}).businessName;return typeof name==="string"?name:null}return null}
export default async function PlatformPage(){
 const user=await getPlatformAdmin(); if(!user) notFound();
 const [rows,activity]=await Promise.all([
  prisma.businessPortal.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{users:true,clients:true,jobs:true}}}}),
  prisma.auditLog.findMany({where:{action:{in:["PLATFORM_CUSTOMER_CREATED","PLATFORM_CUSTOMER_UPDATED"]}},orderBy:{createdAt:"desc"},take:12,select:{id:true,action:true,actorEmail:true,details:true,createdAt:true}}),
 ]);
 const active=rows.filter(b=>b.active); const mrr=active.reduce((sum,b)=>sum+Number(b.monthlyPrice??0),0); const seats=rows.reduce((sum,b)=>sum+b._count.users,0);
 const businesses=rows.map(b=>({...b,monthlyPrice:b.monthlyPrice===null?null:Number(b.monthlyPrice)}));
 return <><TopBar title="Your Plan HQ" subtitle="Customers, subscriptions, access and portal configuration"/><main className="flex-1 overflow-auto p-4 md:p-6" style={{background:"#03101f"}}><div className="mx-auto max-w-7xl space-y-4">
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Building2 size={17}/>} label="Customer businesses" value={String(rows.length)}/><Metric icon={<Power size={17}/>} label="Active subscriptions" value={String(active.length)}/><Metric icon={<CircleDollarSign size={17}/>} label="Monthly recurring" value={new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",maximumFractionDigits:0}).format(mrr)}/><Metric icon={<Users size={17}/>} label="Customer users" value={String(seats)}/></section>
 <BusinessPortalForm/><BusinessPortalManager businesses={businesses}/>
 <section className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:UI.border}}><div><h2 className="text-sm font-semibold" style={{color:UI.text}}>Recent SaaS activity</h2><p className="mt-1 text-xs" style={{color:UI.faint}}>Customer onboarding and configuration changes recorded by YourPlan HQ.</p></div><Activity size={18} style={{color:UI.cyan}}/></div>{activity.length===0?<div className="px-5 py-8 text-sm" style={{color:UI.mute}}>No platform activity recorded yet.</div>:<div className="divide-y" style={{borderColor:UI.border}}>{activity.map(item=><div key={item.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between" style={{borderColor:UI.border}}><div><p className="text-sm font-medium" style={{color:UI.text}}>{activityLabel(item.action)}{businessName(item.details)?` · ${businessName(item.details)}`:""}</p><p className="mt-1 text-xs" style={{color:UI.mute}}>{item.actorEmail||"Platform admin"}</p></div><time className="text-xs" style={{color:UI.faint}}>{new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeStyle:"short",timeZone:"Australia/Melbourne"}).format(item.createdAt)}</time></div>)}</div>}</section>
 </div></main></>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center gap-2 text-xs" style={{color:UI.mute}}><span style={{color:UI.cyan}}>{icon}</span>{label}</div><div className="mt-2 text-2xl font-semibold" style={{color:UI.text}}>{value}</div></div>}
