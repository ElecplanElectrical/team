import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ target: string; id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = user.businessId;

  const { target, id } = await ctx.params;
  if (target === "material" && !user.business?.modules.includes("materials")) return NextResponse.json({ error: "Materials module is disabled for this business" }, { status: 403 });
  let photo: { photoStorageKey: string | null; photoData: Uint8Array | null; photoContentType: string | null } | null = null;
  if (target === "equipment") photo = await prisma.equipment.findFirst({ where: { id, businessId }, select: { photoStorageKey: true, photoData: true, photoContentType: true } });
  else if (target === "material") photo = await prisma.stockItem.findFirst({ where: { id, businessId }, select: { photoStorageKey: true, photoData: true, photoContentType: true } });
  else return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (photo?.photoData) return new NextResponse(new Uint8Array(photo.photoData), { headers: { "Content-Type": photo.photoContentType || "image/jpeg", "Content-Length": String(photo.photoData.length), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  const key = photo?.photoStorageKey ?? null;
  if (!key) return NextResponse.json({ error: "No photo for this business" }, { status: 404 });
  if (key.startsWith("data:image/")) {
    const comma = key.indexOf(",");
    if (comma < 0) return NextResponse.json({ error: "Invalid photo" }, { status: 500 });
    const meta = key.slice(5, comma), type = meta.split(";")[0] || "image/jpeg";
    return new NextResponse(Buffer.from(key.slice(comma + 1), "base64"), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
  }
  return NextResponse.redirect(createDownloadUrl(key), 302);
}
