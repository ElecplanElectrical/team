import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, verifyCommitToken } from "@/lib/storage";

const schema = z.object({ target:z.enum(["equipment","material"]), targetId:z.string().min(1), commitToken:z.string().min(1) });
const fallbackSchema = schema.omit({ commitToken: true });
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  if (!user.businessId) return NextResponse.json({ error:"No active customer business selected." }, { status:409 });
  const businessId = user.businessId;

  if (req.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const parsed = fallbackSchema.safeParse({ target: form?.get("target"), targetId: form?.get("targetId") });
    const file = form?.get("file");
    if (!parsed.success || !(file instanceof File) || file.size <= 0) return NextResponse.json({ error:"Photo and item are required" }, { status:400 });
    if (!PHOTO_TYPES.has(file.type)) return NextResponse.json({ error:"Photos must be JPG, PNG or WebP" }, { status:400 });
    if (file.size > PHOTO_MAX_BYTES) return NextResponse.json({ error:`Photo is too large. Maximum is ${Math.floor(PHOTO_MAX_BYTES / 1024 / 1024)} MB.` }, { status:400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const metadata = { photoStorageKey:null, photoOriginalName:file.name.slice(0, 200), photoContentType:file.type, photoSizeBytes:file.size, photoData:bytes };
    if (parsed.data.target === "equipment") {
      if (user.role !== "ADMIN") return NextResponse.json({ error:"Only admin can change equipment photos" }, { status:403 });
      const updated = await prisma.equipment.updateMany({ where:{ id:parsed.data.targetId, businessId }, data:metadata });
      if (updated.count !== 1) return NextResponse.json({ error:"Equipment not found for this business" }, { status:404 });
    } else {
      if (!user.business?.modules.includes("materials")) return NextResponse.json({ error:"Materials module is disabled for this business" }, { status:403 });
      const updated = await prisma.stockItem.updateMany({ where:{ id:parsed.data.targetId, businessId }, data:metadata });
      if (updated.count !== 1) return NextResponse.json({ error:"Material not found for this business" }, { status:404 });
    }
    return NextResponse.json({ ok:true });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error:"Invalid photo commit" }, { status:400 });
  if (parsed.data.target === "material" && !user.business?.modules.includes("materials")) return NextResponse.json({ error:"Materials module is disabled for this business" }, { status:403 });
  const kind = parsed.data.target === "equipment" ? "equipment-photos" : "material-photos";
  const file = verifyCommitToken(parsed.data.commitToken, kind);
  if (!file) return NextResponse.json({ error:"Upload expired or invalid" }, { status:400 });

  if (parsed.data.target === "equipment") {
    if (user.role !== "ADMIN") return NextResponse.json({ error:"Only admin can change equipment photos" }, { status:403 });
    const updated = await prisma.equipment.updateMany({ where:{ id:parsed.data.targetId, businessId }, data:{ photoStorageKey:file.key, photoOriginalName:file.fileName, photoContentType:file.contentType, photoSizeBytes:file.sizeBytes, photoData:null } });
    if (updated.count !== 1) return NextResponse.json({ error:"Equipment not found for this business" }, { status:404 });
  } else {
    const updated = await prisma.stockItem.updateMany({ where:{ id:parsed.data.targetId, businessId }, data:{ photoStorageKey:file.key, photoOriginalName:file.fileName, photoContentType:file.contentType, photoSizeBytes:file.sizeBytes, photoData:null } });
    if (updated.count !== 1) return NextResponse.json({ error:"Material not found for this business" }, { status:404 });
  }
  return NextResponse.json({ ok:true });
}
