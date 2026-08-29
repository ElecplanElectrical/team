import { requireUser } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row" style={{background:"#03101f",color:"#f4f8ff",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} brand={user.business} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">{children}</main>
      <MobileNav role={user.role} brand={user.business} />
    </div>
  );
}
