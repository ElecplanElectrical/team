import {
  createCipheriv,
  createECDH,
  createPrivateKey,
  hkdfSync,
  randomBytes,
  sign as signJwt,
} from "node:crypto";
import { prisma } from "@/lib/prisma";

type PushSubscriptionRow = {
  endpoint: string;
  userId: string;
  p256dh: string;
  auth: string;
};

type TeamChatPush = {
  businessId: string;
  businessName: string;
  businessSlug?: string | null;
  senderId: string;
  senderName: string;
  body: string;
};

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function vapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  try {
    const publicBytes = decodeBase64Url(publicKey);
    const privateBytes = decodeBase64Url(privateKey);
    if (publicBytes.length !== 65 || publicBytes[0] !== 4 || privateBytes.length !== 32) return null;
    return { publicKey, publicBytes, privateBytes };
  } catch {
    return null;
  }
}

export function pushConfigured() {
  return Boolean(vapidKeys());
}

export function validPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host.endsWith(".fcm.googleapis.com")
      || host === "web.push.apple.com"
      || host.endsWith(".push.services.mozilla.com")
      || host.endsWith(".notify.windows.com");
  } catch {
    return false;
  }
}

function vapidAuthorization(endpoint: string, keys: NonNullable<ReturnType<typeof vapidKeys>>) {
  const audience = new URL(endpoint).origin;
  const header = base64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64Url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: process.env.VAPID_SUBJECT ?? "mailto:hello@your-plan.com.au",
  }));
  const signingInput = `${header}.${payload}`;
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: base64Url(keys.publicBytes.subarray(1, 33)),
      y: base64Url(keys.publicBytes.subarray(33, 65)),
      d: base64Url(keys.privateBytes),
    },
    format: "jwk",
  });
  const signature = signJwt("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${signingInput}.${base64Url(signature)}, k=${keys.publicKey}`;
}

function encryptPayload(payload: string, clientPublicKey: string, clientAuth: string) {
  const receiverPublic = decodeBase64Url(clientPublicKey);
  const authSecret = decodeBase64Url(clientAuth);
  if (receiverPublic.length !== 65 || receiverPublic[0] !== 4 || authSecret.length < 16) {
    throw new Error("Invalid push subscription keys");
  }

  const sender = createECDH("prime256v1");
  sender.generateKeys();
  const senderPublic = sender.getPublicKey();
  const sharedSecret = sender.computeSecret(receiverPublic);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf8"),
    receiverPublic,
    senderPublic,
  ]);
  const inputKeyMaterial = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, keyInfo, 32));
  const salt = randomBytes(16);
  const contentKey = Buffer.from(hkdfSync("sha256", inputKeyMaterial, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", inputKeyMaterial, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const plaintext = Buffer.concat([Buffer.from(payload, "utf8"), Buffer.from([2])]);
  const cipher = createCipheriv("aes-128-gcm", contentKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recordSize, Buffer.from([senderPublic.length]), senderPublic, ciphertext]);
}

async function deliver(subscription: PushSubscriptionRow, payload: string, keys: NonNullable<ReturnType<typeof vapidKeys>>) {
  if (!validPushEndpoint(subscription.endpoint)) return "invalid" as const;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidAuthorization(subscription.endpoint, keys),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "normal",
      },
      body: encryptPayload(payload, subscription.p256dh, subscription.auth),
      signal: controller.signal,
    });
    if (response.status === 404 || response.status === 410) return "expired" as const;
    return response.ok ? "sent" as const : "failed" as const;
  } catch {
    return "failed" as const;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTeamChatPush(message: TeamChatPush) {
  const keys = vapidKeys();
  if (!keys) return;
  const subscriptions = await prisma.$queryRaw<PushSubscriptionRow[]>`
    SELECT p."endpoint", p."userId", p."p256dh", p."auth"
    FROM "PushSubscription" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE u."businessId" = ${message.businessId}
      AND u."active" = TRUE
      AND p."userId" <> ${message.senderId}
  `;
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: `${message.businessName} Team`,
    body: `${message.senderName}: ${message.body}`,
    icon: message.businessSlug === "qls" ? "/qls-logo-transparent.svg" : "/elecplan-app-icon.svg",
    badge: message.businessSlug === "qls" ? "/qls-logo-transparent.svg" : "/elecplan-app-icon.svg",
    tag: `team-chat-${message.businessId}`,
    url: "/team-chat",
  });
  const results = await Promise.all(subscriptions.map(async (subscription) => ({
    endpoint: subscription.endpoint,
    result: await deliver(subscription, payload, keys),
  })));
  const stale = results.filter(({ result }) => result === "expired" || result === "invalid").map(({ endpoint }) => endpoint);
  if (stale.length) await prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "endpoint" = ANY(${stale}::text[])`;
}
