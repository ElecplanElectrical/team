import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl, storageConfigured } from "@/lib/storage";

function storageKeyFromLogoUrl(logoUrl: string | null, slug: string): string | null {
  if (!logoUrl) return null;
  try {
    const parsed = new URL(logoUrl, "https://your-plan.com.au");
    if (parsed.pathname !== `/api/branding/${slug}/logo`) return null;
    const key = parsed.searchParams.get("key")?.trim();
    if (!key || !key.startsWith("documents/")) return null;
    return key;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await prisma.businessPortal.findUnique({
    where: { slug },
    select: { active: true, logoUrl: true },
  });
  if (!business?.active) return new NextResponse(null, { status: 404 });
  const key = storageKeyFromLogoUrl(business.logoUrl, slug);
  if (!key || !storageConfigured()) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(createDownloadUrl(key), 307);
}
