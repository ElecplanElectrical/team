import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Building2, CircleDollarSign, Power, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin } from "@/lib/platform-admin";
import TopBar from "@/components/TopBar";

const UI={panel:"var(--brand-panel, #07192b)",border:"var(--brand-border, rgba(77,150,221,.24))",text:"#f5f9ff",mute:"var(--brand-muted, #93a9c2)",faint:"var(--brand-faint, #617993)",cyan:"var(--brand-accent, #25c7ff)"};
function activityLabel(action:string){if(action==="PLATFORM_CUSTOMER_CREATED")return"Customer created";if(action==="PLATFORM_CUSTOMER_UPDATED")return"Customer updated";if(action==="PLATFORM_SUBSCRIPTION_UPDATED")return"Subscription updated";if(action==="PLATFORM_PAYMENT_RECORDED")return"Payment recorded";return action.replaceAll("_"," ").toLowerCase()}
function businessName(details:unknown){if(details&&typeof details==="object"&&!Array.isArray(details)&&"businessName" in details){const name=(details as{businessName?:unknown}).businessName;return typeof name==="string"?name:null}return null}

export default async function HqPage(){
 const user=await getPlatformAdmin();if(!user)notFound();
 const[rows,activity]=await Promise.all([
  prisma.businessPortal.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{users:true}}}}),
  prisma.auditLog.findMany({where:{action:{in:["PLATFORM_CUSTOMER_CREATED","PLATFORM_CUSTOMER_UPDATED","PLATFORM_SUBSCRIPTION_UPDATED","PLATFORM_PAYMENT_RECORDED","PLATFORM_PAYMENT_UPDATED"]}},orderBy:{createdAt:"desc"},take:6,select:{id:true,action:true,actorEmail:true,details:true,createdAt:true}})
 ]);
 const active=rows.filter(b=>b.active),mrr=active.reduce((s,b)=>s+Number(b.monthlyPrice??0),0),seats=rows.reduce((s,b)=>s+b._count.users,0);
 return <><TopBar title="Your Plan HQ" subtitle="Platform overview"/><main className="flex-1 overflow-auto p-4 md:p-6" style={{background:"var(--app-bg, #03101f)"}}><div className="mx-auto max-w-7xl space-y-4">
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Building2 size={17}/>} label="Customer businesses" value={String(rows.length)}/><Metric icon={<Power size={17}/>} label="Active subscriptions" value={String(active.length)}/><Metric icon={<CircleDollarSign size={17}/>} label="Monthly recurring" value={new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",maximumFractionDigits:0}).format(mrr)}/><Metric icon={<Users size={17}/>} label="Customer users" value={String(seats)}/></section>
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Quick href="/hq/customers" title="Customers" text="Customer records and account details"/><Quick href="/hq/portals" title="Customer Portals" text="Open and configure each business portal"/><Quick href="/hq/subscriptions" title="Subscriptions" text="Plans, status and recurring billing"/><Quick href="/hq/users" title="Users & Access" text="Customer admins and portal access"/></section>
  <section className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:UI.border}}><div><h2 className="text-sm font-semibold" style={{color:UI.text}}>Recent activity</h2><p className="mt-1 text-xs" style={{color:UI.faint}}>Latest platform changes only.</p></div><Activity size={18} style={{color:UI.cyan}}/></div>{activity.length===0?<div className="px-5 py-8 text-sm" style={{color:UI.mute}}>No platform activity recorded yet.</div>:<div className="divide-y" style={{borderColor:UI.border}}>{activity.map(item=><div key={item.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between" style={{borderColor:UI.border}}><div><p className="text-sm font-medium" style={{color:UI.text}}>{activityLabel(item.action)}{businessName(item.details)?` · ${businessName(item.details)}`:""}</p><p className="mt-1 text-xs" style={{color:UI.mute}}>{item.actorEmail||"Platform admin"}</p></div><time className="text-xs" style={{color:UI.faint}}>{new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeStyle:"short",timeZone:"Australia/Melbourne"}).format(item.createdAt)}</time></div>)}</div>}</section>
 </div></main></>
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-center gap-2 text-xs" style={{color:UI.mute}}><span style={{color:UI.cyan}}>{icon}</span>{label}</div><div className="mt-2 text-2xl font-semibold" style={{color:UI.text}}>{value}</div></div>}
function Quick({href,title,text}:{href:string;title:string;text:string}){return <Link href={href} className="rounded-xl p-4 transition hover:-translate-y-0.5" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><p className="text-sm font-semibold" style={{color:UI.cyan}}>{title}</p><p className="mt-2 text-xs leading-5" style={{color:UI.mute}}>{text}</p></Link>}
