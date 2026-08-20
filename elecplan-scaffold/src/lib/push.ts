import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function sendTeamChatPush(senderId: string, senderName: string, body: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@elecplan.com.au", publicKey, privateKey);
  const subscriptions = await prisma.$queryRaw<StoredSubscription[]>`
    SELECT p."endpoint", p."p256dh", p."auth"
    FROM "PushSubscription" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE p."userId" <> ${senderId} AND u."active" = true
  `;
  const payload = JSON.stringify({ title: `${senderName} · Elecplan Team`, body, url: "/dashboard?teamChat=1", tag: "elecplan-team-chat" });

  await Promise.allSettled(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "endpoint" = ${sub.endpoint}`;
      }
    }
  }));
}
