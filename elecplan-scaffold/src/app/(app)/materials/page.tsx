import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import MaterialsView, { type StockRow } from "@/components/MaterialsView";
export default async function MaterialsPage(){await requireAccess("materials");const rows=await prisma.stockItem.findMany({orderBy:{name:"asc"}});const items:StockRow[]=rows.map(item=>({id:item.id,name:item.name,unit:item.unit,onHand:item.onHand,parLevel:item.parLevel,supplier:item.supplier,hasPhoto:Boolean(item.photoStorageKey)}));return <MaterialsView items={items}/>;}
