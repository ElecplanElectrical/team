"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import type { YourPlanModule } from "@/lib/brand";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor } from "@/lib/nav";
import YourPlanLogo from "@/components/YourPlanLogo";

const UI={mute:"#9aaeaa",faint:"#647a6d"};
type Brand={name:string;slug:string;logoUrl:string|null;primaryColor:string;accentColor:string;modules:YourPlanModule[]}|null;

function MobileBrand({brand,drawer=false}:{brand?:Brand;drawer?:boolean}) {
  if (!brand?.logoUrl) return <YourPlanLogo width={drawer?144:112}/>;
  const isQls=brand.slug==="qls";
  return <div className="flex items-center gap-2.5">
    <img src={brand.logoUrl} alt={brand.name} className={drawer?"h-28 w-auto max-w-[150px] object-contain object-left":"h-11 w-11 object-contain"}/>
    {isQls?<div><strong className={drawer?"block text-xl font-black tracking-[.15em] text-white":"block text-base font-black tracking-[.16em] text-white"}>QLS</strong>{drawer?<span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-slate-400">Team portal</span>:null}</div>:null}
  </div>;
}

export default function MobileNav({role,brand}:{role:Role;brand?:Brand}) {
  const pathname=usePathname();
  const groups=navGroupsFor(role,brand?.modules);
  const[open,setOpen]=useState(false);
  const primary=brand?.primaryColor||"#168dff";
  const accent=brand?.accentColor||"#25c7ff";
  const isQls=brand?.slug==="qls";
  const border=brand?`${accent}36`:"rgba(73,145,214,.22)";
  const panel=brand?"#10261a":"#07192b";
  const label=brand?.name||"Your Plan";
  const logoutUrl=isQls?"/login?tenant=qls&callbackUrl=%2Fdashboard":"/login";
  return <>
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 md:hidden" style={{background:isQls?"rgba(5,15,8,.97)":"rgba(2,14,27,.97)",borderBottom:`1px solid ${border}`,backdropFilter:"blur(16px)"}}>
      <button type="button" onClick={()=>setOpen(true)} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-lg" style={{background:panel,border:`1px solid ${border}`,color:UI.mute}}><Menu size={19}/></button>
      <Link href="/dashboard" aria-label={`${label} dashboard`} className="flex h-12 items-center justify-center"><MobileBrand brand={brand}/></Link>
      <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-lg" style={{background:panel,border:`1px solid ${border}`,color:UI.mute}}><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500"/></button>
    </div>
    {open&&<div className="fixed inset-0 z-[60] md:hidden">
      <button type="button" aria-label="Close navigation overlay" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setOpen(false)}/>
      <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col overflow-y-auto p-4 shadow-2xl" style={{background:isQls?`linear-gradient(180deg,#07130b,${primary}12,#050d08)`:"linear-gradient(180deg,#02101f,#031321)",borderRight:`1px solid ${border}`}}>
        <div className="mb-5 flex items-center justify-between"><MobileBrand brand={brand} drawer/><button type="button" onClick={()=>setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{background:panel,border:`1px solid ${border}`,color:UI.mute}}><X size={18}/></button></div>
        <nav className="space-y-5">{groups.map((group,gi)=><div key={group.heading??gi}>{group.heading&&<p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.13em]" style={{color:UI.faint}}>{group.heading}</p>}<div className="space-y-1">{group.items.map(item=>{const href=SCREEN_PATH[item.screen];const active=pathname===href||pathname.startsWith(href+"/");const Icon=item.icon;return <Link key={item.screen} href={href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium" style={{background:active?`linear-gradient(90deg,${primary}b8,${primary}35)`:"transparent",color:active?"#f4f8ff":UI.mute}}><Icon size={17} style={{color:active?accent:undefined}}/>{item.label}</Link>})}</div></div>)}</nav>
        <button type="button" onClick={()=>signOut({callbackUrl:logoutUrl})} className="mt-auto flex items-center gap-3 border-t px-3 pt-5 text-sm font-medium" style={{borderColor:border,color:UI.mute}}><LogOut size={17}/> Sign out{isQls?" of QLS":""}</button>
      </aside>
    </div>}
  </>;
}
