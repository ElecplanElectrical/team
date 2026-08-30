import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { firstAccessibleModulePath } from "@/lib/access";
import { HomePage } from "@/components/yourplan-public";
import { DesktopHomePage } from "@/components/yourplan-home-desktop";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    if (!user.businessId && user.role === "ADMIN") redirect("/hq");
    if (user.business) redirect(firstAccessibleModulePath(user.role, user.business.modules));
    redirect("/account");
  }

  return (
    <>
      <div className="hidden lg:block"><DesktopHomePage /></div>
      <div className="lg:hidden"><HomePage /></div>
    </>
  );
}
