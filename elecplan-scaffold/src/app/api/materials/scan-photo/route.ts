import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { canUseMaterialScanner } from "@/lib/material-capabilities";

const schema = z.object({
  stockItemId: z.string().min(1),
  dataUrl: z.string().startsWith("data:image/jpeg;base64,").max(1_800_000),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.businessId) return NextResponse.json({ error: "No active customer business selected." }, { status: 409 });
  if (!user.business?.modules.includes("materials")) return NextResponse.json({ error: "Materials module is disabled for this business" }, { status: 403 });
  if (!canUseMaterialScanner(user.business?.slug)) return NextResponse.json({ error: "Stock scanning is not enabled for this business" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scan photo" }, { status: 400 });
  const item = await prisma.stockItem.findFirst({ where: { id: parsed.data.stockItemId, businessId: user.businessId }, select: { id: true } });
  if (!item) return NextResponse.json({ error: "Material not found for this business" }, { status: 404 });

  const comma = parsed.data.dataUrl.indexOf(",");
  const bytes = Buffer.from(parsed.data.dataUrl.slice(comma + 1), "base64");
  if (!bytes.length || bytes.length > 1_350_000) return NextResponse.json({ error: "Scan photo is empty or too large" }, { status: 400 });

  const updated = await prisma.stockItem.updateMany({
    where: { id: item.id, businessId: user.businessId },
    data: {
      photoStorageKey: null,
      photoOriginalName: `scan-${Date.now()}.jpg`,
      photoContentType: "image/jpeg",
      photoSizeBytes: bytes.length,
      photoData: bytes,
    },
  });
  if (updated.count !== 1) return NextResponse.json({ error: "Material changed while saving the photo" }, { status: 409 });
  await recordAudit({ actor: user, action: "STOCK_SCAN_PHOTO_SAVED", entityType: "StockItem", entityId: item.id, details: { businessId: user.businessId, sizeBytes: bytes.length } });
  return NextResponse.json({ ok: true, queued: false });
}
