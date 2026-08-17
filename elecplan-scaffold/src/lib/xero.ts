export const XERO_AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
export const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
export const XERO_ACCOUNTING_API_BASE = "https://api.xero.com/api.xro/2.0";

// Minimum foundation scopes for long-lived accounting access. Additional scopes
// should only be added when a concrete Elecplan feature needs them.
export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.transactions",
] as const;

export function xeroConfigStatus() {
  const missing: string[] = [];
  if (!process.env.XERO_CLIENT_ID) missing.push("XERO_CLIENT_ID");
  if (!process.env.XERO_CLIENT_SECRET) missing.push("XERO_CLIENT_SECRET");
  if (!process.env.XERO_REDIRECT_URI) missing.push("XERO_REDIRECT_URI");
  if (!process.env.XERO_TOKEN_ENCRYPTION_KEY) missing.push("XERO_TOKEN_ENCRYPTION_KEY");

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function requireXeroConfig() {
  const status = xeroConfigStatus();
  if (!status.configured) {
    throw new Error(`Xero integration is not configured: ${status.missing.join(", ")}`);
  }

  return {
    clientId: process.env.XERO_CLIENT_ID as string,
    clientSecret: process.env.XERO_CLIENT_SECRET as string,
    redirectUri: process.env.XERO_REDIRECT_URI as string,
    tokenEncryptionKey: process.env.XERO_TOKEN_ENCRYPTION_KEY as string,
  };
}
