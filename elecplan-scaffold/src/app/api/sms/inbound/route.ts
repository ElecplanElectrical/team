import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

function normalizeAustralianMobile(value: string): string | null {
  const compact = value.trim().replace(/[^\d+]/g, "");
  let normalized = compact;
  if (normalized.startsWith("0061")) normalized = `+61${normalized.slice(4)}`;
  else if (normalized.startsWith("61")) normalized = `+${normalized}`;
  else if (normalized.startsWith("04")) normalized = `+61${normalized.slice(1)}`;
  return /^\+614\d{8}$/.test(normalized) ? normalized : null;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });

  const fromRaw = String(form.get("from") ?? form.get("source") ?? "");
  const body = String(form.get("body") ?? form.get("message") ?? "").trim().toUpperCase();
  const from = normalizeAustralianMobile(fromRaw);
  if (!from || !["YES", "Y", "NO", "N"].includes(body)) return NextResponse.json({ ok: true });

  const latest = await prisma.smsLog.findFirst({
    where: { phoneNumber: from, status: "SENT" },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { id: true, businessId: true } } },
  });
  if (!latest) return NextResponse.json({ ok: true });

  const status = body === "YES" || body === "Y" ? "CONFIRMED" : "DECLINED";
  await prisma.smsLog.update({ where: { id: latest.id }, data: { status } });
  await recordAudit({ actor: {}, action: status === "CONFIRMED" ? "CLIENT_CONFIRMATION_SMS_CONFIRMED" : "CLIENT_CONFIRMATION_SMS_DECLINED", entityType: "Job", entityId: latest.job.id, details: { businessId: latest.job.businessId, smsLogId: latest.id } });

  return NextResponse.json({ ok: true });
}
