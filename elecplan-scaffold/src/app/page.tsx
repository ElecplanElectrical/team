import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { firstAccessibleModulePath } from "@/lib/access";

export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!user.businessId && user.role === "ADMIN") redirect("/platform");
  if (user.business) redirect(firstAccessibleModulePath(user.role, user.business.modules));

  redirect("/account");
}
