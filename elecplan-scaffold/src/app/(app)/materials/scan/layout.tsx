import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/session";
import { canUseMaterialScanner } from "@/lib/material-capabilities";

export default async function MaterialScanLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAccess("materials");

  if (!canUseMaterialScanner(user.business?.slug)) {
    redirect("/materials");
  }

  return children;
}
