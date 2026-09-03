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
  const primary=user.business?.primaryColor??"#168dff";
  const accent=user.business?.accentColor??"#25c7ff";
  const theme={
    "--brand-primary":isQls?"#50d878":primary,
    "--brand-accent":isQls?"#82eca0":accent,
    "--brand-primary-rgb":isQls?"80 216 120":"22 141 255",
    "--brand-accent-rgb":isQls?"130 236 160":"37 199 255",
    "--brand-primary-deep":isQls?"#219447":"#075fd0",
    "--brand-primary-soft":isQls?"rgba(80,216,120,.12)":"#0d2a48",
    "--brand-border":isQls?"rgba(180,198,186,.17)":`${accent}38`,
    "--brand-border-soft":isQls?"rgba(180,198,186,.08)":`${accent}20`,
    "--brand-glow":isQls?"rgba(80,216,120,.075)":`${primary}35`,
    "--brand-panel":isQls?"#0d1110":"#081b30",
    "--brand-panel-alt":isQls?"#151a17":"#0a2038",
    "--brand-panel-deep":isQls?"#080b09":"#041323",
    "--brand-muted":isQls?"#aab3ad":"#93a9c2",
    "--brand-faint":isQls?"#6f7972":"#617993",
    "--app-bg":isQls?"#040605":"#03101f",
  } as CSSProperties;
  return (
    <div className={`${isQls?"qls-theme ":""}flex min-h-screen w-full flex-col md:flex-row`} style={{...theme,background:isQls?"radial-gradient(circle at 52% -12%,rgba(80,216,120,.04),transparent 34%),#040605":"#03101f",color:"#f4f8ff",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} brand={user.business} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 md:pt-0">{children}</main>
      <MobileNav role={user.role} brand={user.business} />
    </div>
  );
}
