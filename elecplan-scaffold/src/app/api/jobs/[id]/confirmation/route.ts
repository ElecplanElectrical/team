import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendSms, smsConfigured } from "@/lib/sms";
import { recordAudit } from "@/lib/audit";

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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Only admins and supervisors can send client confirmations" }, { status: 403 });
  }

  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: {
        select: { name: true, contactName: true, phone: true },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.scheduledStart) {
    return NextResponse.json({ error: "Schedule the job before sending a confirmation" }, { status: 400 });
  }
  if (!job.client.phone?.trim()) {
    return NextResponse.json({ error: "This client does not have a phone number" }, { status: 400 });
  }
  if (!smsConfigured()) {
    return NextResponse.json(
      { error: "SMS is not configured yet. Add ClickSend credentials before sending live texts." },
      { status: 503 },
    );
  }

  const to = normalizeAustralianMobile(job.client.phone);
  const firstName = (job.client.contactName || job.client.name).trim().split(/\s+/)[0] || "there";
  const message = `Hi ${firstName}, your Elecplan booking for ${job.title} is confirmed for ${bookingTime(job.scheduledStart)} at ${job.address}. If you need to change the booking, please contact Elecplan. - Elecplan`;

  try {
    const result = await sendSms(to, message);
    const smsLog = await prisma.smsLog.create({
      data: {
        jobId: job.id,
        phoneNumber: to,
        message,
        status: "SENT",
        providerId: result.providerId,
      },
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
      data: {
        jobId: job.id,
        phoneNumber: to,
        message,
        status: "FAILED",
      },
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
