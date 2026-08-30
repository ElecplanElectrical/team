import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { firstAccessibleModulePath } from "@/lib/access";
import { LockedExactHome } from "@/components/locked-exact-home";
import { LockedMobileHome } from "@/components/locked-mobile-home";

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    if (!user.businessId && user.role === "ADMIN") redirect("/hq");
    if (user.business) redirect(firstAccessibleModulePath(user.role, user.business.modules));
    redirect("/account");
  }

  return (
    <>
      <div className="hidden md:block"><LockedExactHome /></div>
      <div className="md:hidden"><LockedMobileHome /></div>
    </>
  );
}
