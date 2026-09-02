"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import type { YourPlanModule } from "@/lib/brand";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor, ROLE_TITLE, initialsOf } from "@/lib/nav";
import YourPlanLogo from "@/components/YourPlanLogo";

const UI={text:"#f4f8ff",mute:"#9aacc2",faint:"#647a6d"};
type Brand={name:string;slug:string;logoUrl:string|null;primaryColor:string;accentColor:string;modules:YourPlanModule[]}|null;

function BrandMark({brand,compact=false}:{brand?:Brand;compact?:boolean}) {
  if (!brand?.logoUrl) return <><YourPlanLogo width={52} className="xl:hidden"/><YourPlanLogo width={176} className="hidden xl:block"/></>;
  return <div className="flex items-center gap-2">
    <img src={brand.logoUrl} alt={brand.name} className={compact?"h-12 w-12 object-contain":"h-12 w-12 object-contain xl:h-[92px] xl:w-auto xl:max-w-[174px]"}/>
    {compact?<span className="hidden text-sm font-black tracking-[.14em] text-white xl:inline">QLS</span>:null}
  </div>;
}

export default function Sidebar({role,name,brand}:{role:Role;name:string;brand?:Brand}) {
  const pathname=usePathname();
  const groups=navGroupsFor(role,brand?.modules);
  const accent=brand?.accentColor||"#25c7ff";
  const primary=brand?.primaryColor||"#168dff";
  const isQls=brand?.slug==="qls";
  const border=brand?`${accent}36`:"rgba(73,145,214,.22)";
  const homeHref="/dashboard";
  const logoutUrl=isQls?"/login?tenant=qls&callbackUrl=%2Fdashboard":"/login";
  return <aside className="hidden shrink-0 flex-col px-2.5 py-5 md:flex md:w-[74px] xl:w-[230px] xl:px-3" style={{background:isQls?`linear-gradient(180deg,#07130b 0%,${primary}12 48%,#050d08 100%)`:"linear-gradient(180deg,#02101f 0%,#031321 100%)",borderRight:`1px solid ${border}`}}>
    <Link href={homeHref} className={`mb-5 flex items-center px-2 xl:px-3 ${brand?"min-h-[94px] justify-center xl:justify-start":"min-h-9"}`} aria-label={`${brand?.name||"Your Plan"} dashboard`}>
      <BrandMark brand={brand} compact={!brand}/>
    </Link>
    <nav className="flex-1 overflow-y-auto pr-0.5">
      {groups.map((group,gi)=><div key={group.heading??gi} className="mb-4 flex flex-col gap-1">
        {group.heading&&<p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] xl:block" style={{color:UI.faint}}>{group.heading}</p>}
        {group.items.map(item=>{const href=SCREEN_PATH[item.screen];const active=pathname===href||pathname.startsWith(href+"/");const Icon=item.icon;return <Link key={item.screen} href={href} title={item.label} className="group flex h-10 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium transition xl:justify-start xl:px-3" style={{background:active?`linear-gradient(90deg,${primary}b8,${primary}35)`:"transparent",color:active?"#fff":UI.mute}}><Icon size={17} style={{color:active?accent:undefined}}/><span className="hidden truncate xl:inline">{item.label}</span></Link>})}
      </div>)}
    </nav>
    <div className="mt-4 border-t pt-3" style={{borderColor:border}}>
      <div className="flex items-center justify-center gap-2 rounded-xl px-1 py-2 xl:justify-start xl:px-2" style={{background:isQls?"rgba(20,52,30,.72)":"rgba(8,28,48,.72)"}}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{background:`${primary}36`,color:"#e8fff0"}}>{initialsOf(name)}</div>
        <div className="hidden min-w-0 flex-1 xl:block"><p className="truncate text-xs font-semibold" style={{color:UI.text}}>{name}</p><p className="truncate text-[10px]" style={{color:UI.faint}}>{ROLE_TITLE[role]}</p></div><ChevronDown size={13} className="hidden xl:block"/>
      </div>
      <div className="mt-2 hidden items-center gap-1 xl:flex"><Link href={role==="ADMIN"?"/settings":"/account"} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[11px]" style={{color:UI.faint}}><Settings size={13}/> Settings</Link><button type="button" onClick={()=>signOut({callbackUrl:logoutUrl})} className="rounded-md p-1.5" style={{color:UI.faint}} aria-label="Sign out"><LogOut size={13}/></button></div>
    </div>
  </aside>;
}
