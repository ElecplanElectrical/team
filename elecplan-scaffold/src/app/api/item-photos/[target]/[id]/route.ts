import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ target: string; id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  const businessId = dbUser.businessId;

  const { target, id } = await ctx.params;
  if (target === "material" && !user.business?.modules.includes("materials")) return NextResponse.json({ error: "Materials module is disabled for this business" }, { status: 403 });
  let key: string | null = null;
  if (target === "equipment") key = (await prisma.equipment.findFirst({ where: { id, businessId }, select: { photoStorageKey: true } }))?.photoStorageKey ?? null;
  else if (target === "material") key = (await prisma.stockItem.findFirst({ where: { id, businessId }, select: { photoStorageKey: true } }))?.photoStorageKey ?? null;
  else return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!key) return NextResponse.json({ error: "No photo for this business" }, { status: 404 });
  if (key.startsWith("data:image/")) {
    const comma = key.indexOf(",");
    if (comma < 0) return NextResponse.json({ error: "Invalid photo" }, { status: 500 });
    const meta = key.slice(5, comma), type = meta.split(";")[0] || "image/jpeg";
    return new NextResponse(Buffer.from(key.slice(comma + 1), "base64"), { headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" } });
  }
  return NextResponse.redirect(createDownloadUrl(key), 302);
}
