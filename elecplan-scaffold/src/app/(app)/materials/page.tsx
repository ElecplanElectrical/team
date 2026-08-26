import Link from "next/link";
import { ScanBarcode } from "lucide-react";
import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import MaterialsView, { type StockRow } from "@/components/MaterialsView";
export default async function MaterialsPage(){const user=await requireAccess("materials");const businessId=user.businessId??"__unassigned__";const rows=await prisma.stockItem.findMany({where:{businessId},orderBy:{name:"asc"}});const items:StockRow[]=rows.map(item=>({id:item.id,name:item.name,unit:item.unit,onHand:item.onHand,parLevel:item.parLevel,supplier:item.supplier,hasPhoto:Boolean(item.photoStorageKey)}));return <div className="relative"><div className="fixed bottom-5 right-5 z-40"><Link href="/materials/scan" className="flex h-14 items-center gap-2 rounded-full bg-[#168dff] px-5 text-sm font-semibold text-white shadow-2xl"><ScanBarcode size={20}/> Scan stock</Link></div><MaterialsView items={items}/></div>;}
