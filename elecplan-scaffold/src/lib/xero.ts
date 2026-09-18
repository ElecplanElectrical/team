import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const XERO_AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
export const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
export const XERO_ACCOUNTING_API_BASE = "https://api.xero.com/api.xro/2.0";
export const XERO_SCOPES = ["openid", "profile", "email", "offline_access", "accounting.contacts"] as const;

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number; scope?: string };

export function xeroConfigStatus() {
  const missing: string[] = [];
  if (!process.env.XERO_CLIENT_ID) missing.push("XERO_CLIENT_ID");
  if (!process.env.XERO_CLIENT_SECRET) missing.push("XERO_CLIENT_SECRET");
  if (!process.env.XERO_REDIRECT_URI) missing.push("XERO_REDIRECT_URI");
  if (!process.env.XERO_TOKEN_ENCRYPTION_KEY) missing.push("XERO_TOKEN_ENCRYPTION_KEY");
  return { configured: missing.length === 0, missing };
}

export function requireXeroConfig() {
  const status = xeroConfigStatus();
  if (!status.configured) throw new Error(`Xero integration is not configured: ${status.missing.join(", ")}`);
  return { clientId: process.env.XERO_CLIENT_ID as string, clientSecret: process.env.XERO_CLIENT_SECRET as string, redirectUri: process.env.XERO_REDIRECT_URI as string, tokenEncryptionKey: process.env.XERO_TOKEN_ENCRYPTION_KEY as string };
}

function encryptionKey() {
  const configured = requireXeroConfig().tokenEncryptionKey;
  const decoded = Buffer.from(configured, "base64");
  return decoded.length === 32 ? decoded : createHash("sha256").update(configured).digest();
}

export function encryptXeroSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptXeroSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted Xero token");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

async function tokenRequest(body: URLSearchParams) {
  const config = requireXeroConfig();
  const response = await fetch(XERO_TOKEN_URL, { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const data = await response.json().catch(() => null) as TokenResponse | null;
  if (!response.ok || !data?.access_token || !data.refresh_token) throw new Error("Xero token exchange failed");
  return data;
}

export async function exchangeXeroCode(code: string) {
  const config = requireXeroConfig();
  return tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: config.redirectUri }));
}

export async function fetchXeroConnections(accessToken: string) {
  const response = await fetch(XERO_CONNECTIONS_URL, { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("Could not read connected Xero organisations");
  return response.json() as Promise<Array<{ tenantId: string; tenantName: string }>>;
}

export async function saveXeroConnection(tokens: TokenResponse, connection: { tenantId: string; tenantName: string }) {
  return prisma.xeroConnection.upsert({
    where: { id: "elecplan" },
    update: { tenantId: connection.tenantId, tenantName: connection.tenantName, accessTokenCiphertext: encryptXeroSecret(tokens.access_token), refreshTokenCiphertext: encryptXeroSecret(tokens.refresh_token), tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000), scopes: tokens.scope || XERO_SCOPES.join(" ") },
    create: { id: "elecplan", tenantId: connection.tenantId, tenantName: connection.tenantName, accessTokenCiphertext: encryptXeroSecret(tokens.access_token), refreshTokenCiphertext: encryptXeroSecret(tokens.refresh_token), tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000), scopes: tokens.scope || XERO_SCOPES.join(" ") },
  });
}

export async function activeXeroAccess() {
  const connection = await prisma.xeroConnection.findUnique({ where: { id: "elecplan" } });
  if (!connection) throw new Error("Xero is not connected");
  if (connection.tokenExpiresAt.getTime() > Date.now() + 60_000) return { connection, accessToken: decryptXeroSecret(connection.accessTokenCiphertext) };
  const refreshed = await tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: decryptXeroSecret(connection.refreshTokenCiphertext) }));
  const updated = await prisma.xeroConnection.update({ where: { id: connection.id }, data: { accessTokenCiphertext: encryptXeroSecret(refreshed.access_token), refreshTokenCiphertext: encryptXeroSecret(refreshed.refresh_token), tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000), scopes: refreshed.scope || connection.scopes } });
  return { connection: updated, accessToken: refreshed.access_token };
}
