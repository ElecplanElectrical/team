import { redirect } from "next/navigation";
import { requireBusinessPortal } from "@/lib/tenant-access";

export default async function BusinessDashboard({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  await requireBusinessPortal(slug);
  redirect("/dashboard");
}
