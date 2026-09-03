import { requireUser } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import type { CSSProperties } from "react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isQls=user.business?.slug==="qls";
  const primary=user.business?.primaryColor??"#168dff";
  const accent=user.business?.accentColor??"#25c7ff";
  const theme={
    "--brand-primary":isQls?"#3cba60":primary,
    "--brand-accent":isQls?"#72d88d":accent,
    "--brand-primary-rgb":isQls?"60 186 96":"22 141 255",
    "--brand-accent-rgb":isQls?"114 216 141":"37 199 255",
    "--brand-primary-deep":isQls?"#237c3d":"#075fd0",
    "--brand-primary-soft":isQls?"rgba(60,186,96,.14)":"#0d2a48",
    "--brand-border":isQls?"rgba(81,190,109,.30)":`${accent}38`,
    "--brand-border-soft":isQls?"rgba(81,190,109,.15)":`${accent}20`,
    "--brand-glow":isQls?"rgba(60,186,96,.26)":`${primary}35`,
    "--brand-panel":isQls?"#0b1510":"#081b30",
    "--brand-panel-alt":isQls?"#101f17":"#0a2038",
    "--brand-panel-deep":isQls?"#07100b":"#041323",
    "--brand-muted":isQls?"#aab7ae":"#93a9c2",
    "--brand-faint":isQls?"#718176":"#617993",
    "--app-bg":isQls?"#050a07":"#03101f",
  } as CSSProperties;
  return (
    <div className={`${isQls?"qls-theme ":""}flex min-h-screen w-full flex-col md:flex-row`} style={{...theme,background:isQls?"radial-gradient(circle at 52% -12%,rgba(60,186,96,.10),transparent 34%),#050a07":"#03101f",color:"#f4f8ff",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} brand={user.business} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 md:pt-0">{children}</main>
      <MobileNav role={user.role} brand={user.business} />
    </div>
  );
}
