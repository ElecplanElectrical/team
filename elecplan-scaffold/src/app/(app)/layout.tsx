import { requireUser } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { COLORS, FONTS } from "@/lib/theme";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div
      className="w-full min-h-screen flex flex-col md:flex-row"
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: FONTS.body,
      }}
    >
      <Sidebar role={user.role} name={user.name ?? user.email ?? "User"} />

      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {children}
      </main>

      <MobileNav role={user.role} />
    </div>
  );
}
