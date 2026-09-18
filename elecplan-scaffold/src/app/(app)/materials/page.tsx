import Link from "next/link";
import { ScanBarcode } from "lucide-react";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import MaterialsView, { type StockRow } from "@/components/MaterialsView";

export default async function MaterialsPage() {
  await requireAccess("materials");
  const rows = await prisma.material.findMany({ orderBy: { name: "asc" } });
  const items: StockRow[] = rows.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit ?? "each",
    onHand: Number(item.stockOnHand),
    parLevel: item.reorderPoint == null ? 0 : Number(item.reorderPoint),
    supplier: item.supplier,
    hasPhoto: Boolean(item.photoStorageKey || item.photoUrl),
  }));

  return <div className="relative"><div className="fixed bottom-5 right-5 z-40 md:hidden"><Link href="/materials/scan" className="flex h-14 items-center gap-2 rounded-full bg-[#38bdf8] px-5 text-sm font-semibold text-[#06213a] shadow-2xl"><ScanBarcode size={20}/> Scan stock</Link></div><MaterialsView items={items}/></div>;
}
