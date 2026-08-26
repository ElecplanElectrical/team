import { createHmac, timingSafeEqual } from "node:crypto";
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

function validWebhookSignature(rawBody: string, provided: string | null): boolean {
  const secret = process.env.CLICKSEND_WEBHOOK_SECRET?.trim();
  if (!secret || !provided) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = provided.replace(/^sha256=/i, "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.text();
  if (!validWebhookSignature(rawBody, req.headers.get("x-yourplan-signature"))) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  let fromRaw = "";
  let replyRaw = "";
  if (contentType.includes("application/json")) {
    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    fromRaw = String(payload.from ?? payload.source ?? "");
    replyRaw = String(payload.body ?? payload.message ?? "");
  } else {
    const form = new URLSearchParams(rawBody);
    fromRaw = form.get("from") ?? form.get("source") ?? "";
    replyRaw = form.get("body") ?? form.get("message") ?? "";
  }

  const from = normalizeAustralianMobile(fromRaw);
  const body = replyRaw.trim().toUpperCase();
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
