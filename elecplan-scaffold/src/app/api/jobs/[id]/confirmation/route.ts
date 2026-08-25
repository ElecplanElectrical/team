import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendSms, smsConfigured } from "@/lib/sms";
import { recordAudit } from "@/lib/audit";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function normalizeAustralianMobile(value: string): string | null {
  const compact = value.trim().replace(/[^\d+]/g, "");
  let normalized = compact;
  if (normalized.startsWith("0061")) normalized = `+61${normalized.slice(4)}`;
  else if (normalized.startsWith("61")) normalized = `+${normalized}`;
  else if (normalized.startsWith("04")) normalized = `+61${normalized.slice(1)}`;
  return /^\+614\d{8}$/.test(normalized) ? normalized : null;
}

function bookingTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

async function confirmationForJob(id: string, businessId: string) {
  const job = await prisma.job.findFirst({ where: { id, businessId }, include: { client: { select: { name: true, contactName: true, phone: true } } } });
  if (!job) return { error: "Job not found for this business", status: 404 } as const;
  if (!job.scheduledStart) return { error: "Schedule the job before sending a confirmation", status: 400 } as const;
  if (!job.client.phone?.trim()) return { error: "This client does not have a phone number", status: 400 } as const;
  const to = normalizeAustralianMobile(job.client.phone);
  if (!to) return { error: "Client phone must be a valid Australian mobile number (04xx xxx xxx or +61 4xx xxx xxx)", status: 400 } as const;
  const firstName = (job.client.contactName || job.client.name).trim().split(/\s+/)[0] || "there";
  const message = `Hi ${firstName}, your booking is confirmed for ${bookingTime(job.scheduledStart)} at ${job.address}. If your plans change or you need to reschedule, please get in touch with us as soon as possible.`;
  return { job, to, message, preview: { jobId: job.id, jobTitle: job.title, clientName: job.client.name, contactName: job.client.contactName, phoneNumber: to, address: job.address, scheduledStart: job.scheduledStart.toISOString(), scheduledEnd: job.scheduledEnd?.toISOString() ?? null, message, configured: smsConfigured() } } as const;
}

async function authorisedUser() {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (user.role === "EMPLOYEE") return { response: NextResponse.json({ error: "Only admins and supervisors can send client confirmations" }, { status: 403 }) } as const;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { businessId: true, active: true } });
  if (!dbUser?.active || !dbUser.businessId) return { response: NextResponse.json({ error: "No active customer business selected." }, { status: 409 }) } as const;
  return { user, businessId: dbUser.businessId } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorisedUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const confirmation = await confirmationForJob(id, auth.businessId);
  if ("error" in confirmation) return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
  return NextResponse.json(confirmation.preview);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorisedUser();
  if ("response" in auth) return auth.response;
  const { user, businessId } = auth;
  const { id } = await params;
  const confirmation = await confirmationForJob(id, businessId);
  if ("error" in confirmation) return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
  if (!smsConfigured()) return NextResponse.json({ error: "SMS is not configured yet. Add SMS provider credentials before sending live texts." }, { status: 503 });

  const limit = await consumeRateLimit(`sms-confirmation:${businessId}:job:${id}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    await recordAudit({ actor: user, action: "CLIENT_CONFIRMATION_SMS_RATE_LIMITED", entityType: "Job", entityId: id, details: { businessId, retryAfterSeconds: limit.retryAfterSeconds } });
    return NextResponse.json({ error: "Too many confirmation texts have been requested for this job. Try again later." }, { status: 429, headers: rateLimitHeaders(limit) });
  }

  const { job, to, message } = confirmation;
  try {
    const result = await sendSms(to, message);
    const smsLog = await prisma.smsLog.create({ data: { jobId: job.id, phoneNumber: to, message, status: "SENT", providerId: result.providerId } });
    await recordAudit({ actor: user, action: "CLIENT_CONFIRMATION_SMS_SENT", entityType: "Job", entityId: job.id, details: { businessId, smsLogId: smsLog.id, providerAccepted: true } });
    return NextResponse.json({ ok: true, phoneNumber: to });
  } catch (error) {
    const smsLog = await prisma.smsLog.create({ data: { jobId: job.id, phoneNumber: to, message, status: "FAILED" } });
    await recordAudit({ actor: user, action: "CLIENT_CONFIRMATION_SMS_FAILED", entityType: "Job", entityId: job.id, details: { businessId, smsLogId: smsLog.id } });
    const reason = error instanceof Error ? error.message : "SMS_SEND_FAILED";
    return NextResponse.json({ error: `Could not send confirmation (${reason})` }, { status: 502 });
  }
}
