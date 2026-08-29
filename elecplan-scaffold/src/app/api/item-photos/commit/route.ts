import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { verifyCommitToken } from "@/lib/storage";

const schema = z.object({ target:z.enum(["equipment","material"]), targetId:z.string().min(1), commitToken:z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const dbUser = await prisma.user.findUnique({ where:{ id:user.id }, select:{ businessId:true, active:true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error:"No active customer business selected." }, { status:409 });
  const businessId = dbUser.businessId;

  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error:"Invalid photo commit" }, { status:400 });
  if (p.data.target === "material" && !user.business?.modules.includes("materials")) return NextResponse.json({ error:"Materials module is disabled for this business" }, { status:403 });
  const kind = p.data.target === "equipment" ? "equipment-photos" : "material-photos";
  const file = verifyCommitToken(p.data.commitToken, kind);
  if (!file) return NextResponse.json({ error:"Upload expired or invalid" }, { status:400 });

  if (p.data.target === "equipment") {
    if (user.role !== "ADMIN") return NextResponse.json({ error:"Only admin can change equipment photos" }, { status:403 });
    const item = await prisma.equipment.findFirst({ where:{ id:p.data.targetId, businessId }, select:{ id:true } });
    if (!item) return NextResponse.json({ error:"Equipment not found for this business" }, { status:404 });
    const updated = await prisma.equipment.updateMany({ where:{ id:item.id, businessId }, data:{ photoStorageKey:file.key, photoOriginalName:file.fileName, photoContentType:file.contentType, photoSizeBytes:file.sizeBytes } });
    if (updated.count !== 1) return NextResponse.json({ error:"Equipment not found for this business" }, { status:404 });
  } else {
    const item = await prisma.stockItem.findFirst({ where:{ id:p.data.targetId, businessId }, select:{ id:true } });
    if (!item) return NextResponse.json({ error:"Material not found for this business" }, { status:404 });
    const updated = await prisma.stockItem.updateMany({ where:{ id:item.id, businessId }, data:{ photoStorageKey:file.key, photoOriginalName:file.fileName, photoContentType:file.contentType, photoSizeBytes:file.sizeBytes } });
    if (updated.count !== 1) return NextResponse.json({ error:"Material not found for this business" }, { status:404 });
  }
  return NextResponse.json({ ok:true });
}
