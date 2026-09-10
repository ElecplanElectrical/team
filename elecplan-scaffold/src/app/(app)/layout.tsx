import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { requireUser } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import type { CSSProperties } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === "qls.your-plan.com.au") {
    return {
      title: { absolute: "Quality Landscape Solutions Team Portal" },
      description: "Private Quality Landscape Solutions team portal.",
      applicationName: "Quality Landscape Solutions",
      robots: { index: false, follow: false },
    };
  }
  return {};
}

export async function generateViewport():Promise<Viewport>{
  const requestHeaders=await headers();
  const host=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(":")[0].toLowerCase();
  return {themeColor:host==="qls.your-plan.com.au"?"#040605":"#03101f"};
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isQls=user.business?.slug==="qls";
  const isPlatformAdmin=user.role==="ADMIN"&&!user.businessId;
  const primary=user.business?.primaryColor??"#168dff";
  const accent=user.business?.accentColor??"#25c7ff";
  const theme={
    "--brand-primary":isQls?"#42cf70":primary,
    "--brand-accent":isQls?"#239a50":accent,
    "--brand-primary-rgb":isQls?"66 207 112":"22 141 255",
    "--brand-accent-rgb":isQls?"35 154 80":"37 199 255",
    "--brand-primary-deep":isQls?"#19763a":"#075fd0",
    "--brand-primary-soft":isQls?"rgba(66,207,112,.11)":"#0d2a48",
    "--brand-border":isQls?"rgba(15,23,42,.13)":`${accent}38`,
    "--brand-border-soft":isQls?"rgba(15,23,42,.075)":`${accent}20`,
    "--brand-glow":isQls?"rgba(32,166,84,.065)":`${primary}35`,
    "--brand-panel":isQls?"#ffffff":"#081b30",
    "--brand-panel-alt":isQls?"#f8faf9":"#0a2038",
    "--brand-panel-deep":isQls?"#eef3f0":"#041323",
    "--brand-muted":isQls?"#667085":"#93a9c2",
    "--brand-faint":isQls?"#8b97a3":"#617993",
    "--app-bg":isQls?"#f3f6f4":"#03101f",
  } as CSSProperties;
  return (
    <div className={`${isQls?"qls-theme ":""}flex min-h-screen w-full flex-col md:flex-row`} style={{...theme,background:isQls?"#f3f6f4":"#03101f",color:isQls?"#101828":"#f4f8ff",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} brand={user.business} platformAdmin={isPlatformAdmin} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 md:pt-0">{children}</main>
      <MobileNav role={user.role} brand={user.business} platformAdmin={isPlatformAdmin} />
    </div>
  );
}
