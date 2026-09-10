import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, MonitorPlay } from "lucide-react";
import { getPlatformAdmin } from "@/lib/platform-admin";
const g="#69be28",d="#080a0b",p="#111416",b="#2a3033",m="#9aa3a7";
const flow=[
 {n:"01",t:"Empire HQ",d:"Start with the branded team portal and rider overview.",h:"/hq/demos/empire"},
 {n:"02",t:"Race Weekend",d:"Show the command centre for the upcoming AUSX round.",h:"/hq/demos/empire/weekend"},
 {n:"03",t:"Riders",d:"Open rider profiles for Brad, Dean and Ryan.",h:"/hq/demos/empire/riders"},
 {n:"04",t:"Race Timings",d:"Show session timing and the optional AUSX live timing integration.",h:"/hq/demos/empire/timings"},
 {n:"05",t:"Race Notes",d:"Capture rider feedback and mechanic notes per session.",h:"/hq/demos/empire/notes"},
 {n:"06",t:"Bike Setup",d:"Track setup values, changes and setup history.",h:"/hq/demos/empire/setup"},
 {n:"07",t:"Team Chat",d:"Show whole-team, event and rider-crew channels with photos/files.",h:"/hq/demos/empire/chat"},
 {n:"08",t:"Team",d:"Explain crew access, roles and rider-specific permissions.",h:"/hq/demos/empire/team"},
 {n:"09",t:"Equipment",d:"Track bikes, pit equipment and service status.",h:"/hq/demos/empire/equipment"},
 {n:"10",t:"Documents",d:"Finish with event files, procedures and shared team resources.",h:"/hq/demos/empire/documents"},
];
export default async function Present(){const user=await getPlatformAdmin();if(!user)notFound();return <main className="min-h-screen text-white" style={{background:d}}><header className="border-b" style={{borderColor:b}}><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6"><Link href="/hq/demos" className="flex items-center gap-1 text-xs" style={{color:m}}><ChevronLeft size={15}/>Client Demos</Link><span className="text-[10px] font-bold uppercase tracking-[.25em]" style={{color:g}}>Empire Presentation Mode</span></div></header><div className="mx-auto max-w-6xl p-4 md:p-6"><section className="rounded-2xl border p-6 md:p-8" style={{background:"linear-gradient(125deg,#111416,#0b0d0e 70%,#15220e)",borderColor:b}}><div className="flex items-center gap-3"><MonitorPlay style={{color:g}}/><div><p className="text-xs font-bold uppercase tracking-[.25em]" style={{color:g}}>Client walkthrough</p><h1 className="mt-1 text-3xl font-black uppercase md:text-4xl">Penrite Racing Empire Kawasaki</h1></div></div><p className="mt-4 max-w-3xl text-sm leading-6" style={{color:m}}>Use this screen during the meeting to move through the demo in a clean order. Every screen is presentation-safe demo data and can later become the starting point for the live Empire portal.</p></section><section className="mt-5 grid gap-3">{flow.map((x,i)=><Link key={x.n} href={x.h} className="group grid gap-3 rounded-xl border p-5 transition hover:-translate-y-0.5 md:grid-cols-[70px_1fr_auto] md:items-center" style={{background:p,borderColor:i===0?"rgba(105,190,40,.55)":b}}><div className="text-2xl font-black italic" style={{color:g}}>{x.n}</div><div><h2 className="font-bold">{x.t}</h2><p className="mt-1 text-xs leading-5" style={{color:m}}>{x.d}</p></div><div className="flex items-center gap-1 text-xs font-bold" style={{color:g}}>Open <ArrowRight size={14}/></div></Link>)}</section></div></main>}
