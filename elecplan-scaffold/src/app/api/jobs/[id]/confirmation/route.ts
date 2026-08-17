import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendSms, smsConfigured } from "@/lib/sms";
import { recordAudit } from "@/lib/audit";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function normalizeAustralianMobile(value: string): string {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("61")) return `+${compact}`;
  if (compact.startsWith("0")) return `+61${compact.slice(1)}`;
  return compact;
}

function bookingTime(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

async function confirmationForJob(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { client: { select: { name: true, contactName: true, phone: true } } },
  });

  if (!job) return { error: "Job not found", status: 404 } as const;
  if (!job.scheduledStart) return { error: "Schedule the job before sending a confirmation", status: 400 } as const;
  if (!job.client.phone?.trim()) return { error: "This client does not have a phone number", status: 400 } as const;

  const to = normalizeAustralianMobile(job.client.phone);
  const firstName = (job.client.contactName || job.client.name).trim().split(/\s+/)[0] || "there";
  const message = `Hi ${firstName}, your Elecplan booking for ${job.title} is confirmed for ${bookingTime(job.scheduledStart)} at ${job.address}. If you need to change the booking, please contact Elecplan. - Elecplan`;

  return {
    job,
    to,
    message,
    preview: {
      jobId: job.id,
      jobTitle: job.title,
      clientName: job.client.name,
      contactName: job.client.contactName,
      phoneNumber: to,
      address: job.address,
      scheduledStart: job.scheduledStart.toISOString(),
      scheduledEnd: job.scheduledEnd?.toISOString() ?? null,
      message,
      configured: smsConfigured(),
    },
  } as const;
}

async function authorisedUser() {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (user.role === "EMPLOYEE") {
    return {
      response: NextResponse.json(
        { error: "Only admins and supervisors can send client confirmations" },
        { status: 403 },
      ),
    } as const;
  }
  return { user } as const;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorisedUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const confirmation = await confirmationForJob(id);
  if ("error" in confirmation) {
    return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
  }

  return NextResponse.json(confirmation.preview);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorisedUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const { id } = await params;
  const limit = await consumeRateLimit(`sms-confirmation:job:${id}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    await recordAudit({
      actor: user,
      action: "CLIENT_CONFIRMATION_SMS_RATE_LIMITED",
      entityType: "Job",
      entityId: id,
      details: { retryAfterSeconds: limit.retryAfterSeconds },
    });
    return NextResponse.json(
      { error: "Too many confirmation texts have been requested for this job. Try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const confirmation = await confirmationForJob(id);
  if ("error" in confirmation) {
    return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
  }
  if (!smsConfigured()) {
    return NextResponse.json(
      { error: "SMS is not configured yet. Add ClickSend credentials before sending live texts." },
      { status: 503 },
    );
  }

  const { job, to, message } = confirmation;
  try {
    const result = await sendSms(to, message);
    const smsLog = await prisma.smsLog.create({
      data: { jobId: job.id, phoneNumber: to, message, status: "SENT", providerId: result.providerId },
    });
    await recordAudit({
      actor: user,
      action: "CLIENT_CONFIRMATION_SMS_SENT",
      entityType: "Job",
      entityId: job.id,
      details: { smsLogId: smsLog.id, providerAccepted: true },
    });
    return NextResponse.json({ ok: true, phoneNumber: to });
  } catch (error) {
    const smsLog = await prisma.smsLog.create({
      data: { jobId: job.id, phoneNumber: to, message, status: "FAILED" },
    });
    await recordAudit({
      actor: user,
      action: "CLIENT_CONFIRMATION_SMS_FAILED",
      entityType: "Job",
      entityId: job.id,
      details: { smsLogId: smsLog.id },
    });
    const reason = error instanceof Error ? error.message : "SMS_SEND_FAILED";
    return NextResponse.json({ error: `Could not send confirmation (${reason})` }, { status: 502 });
  }
}
