import { randomBytes, createHash } from "crypto";

/**
 * One-time token helpers for the invite + password-reset flows.
 *
 * The raw token is high-entropy (32 random bytes) so a plain SHA-256 hash is
 * sufficient at rest — no need for bcrypt here. Only the hash is stored
 * (PasswordToken.tokenHash); the raw value lives solely in the link handed to
 * the user. Node-only (uses `crypto`); import from API routes, never the Edge
 * middleware.
 */

export const INVITE_TTL_HOURS = 72; // 3 days to accept an invite
export const RESET_TTL_HOURS = 2; // short window for a reset link

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** A fresh random token and its hash. Store the hash; send the raw. */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function expiryFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Absolute "set your password" link the admin copies and sends to the user. */
export function setPasswordUrl(origin: string, rawToken: string): string {
  const url = new URL("/set-password", origin);
  url.searchParams.set("token", rawToken);
  return url.toString();
}
