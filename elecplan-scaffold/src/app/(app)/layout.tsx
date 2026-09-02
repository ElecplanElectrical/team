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
    "--brand-primary":primary,
    "--brand-accent":accent,
    "--brand-border":`${accent}38`,
    "--brand-glow":`${primary}35`,
    "--brand-panel":isQls?"#0b1a12":"#081b30",
    "--brand-panel-alt":isQls?"#10261a":"#0a2038",
    "--app-bg":isQls?"#07100a":"#03101f",
  } as CSSProperties;
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row" style={{...theme,background:isQls?"#07100a":"#03101f",color:"#f4f8ff",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} brand={user.business} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-16 md:pt-0">{children}</main>
      <MobileNav role={user.role} brand={user.business} />
    </div>
  );
}
