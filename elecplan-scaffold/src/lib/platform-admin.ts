import { getSessionUser } from "@/lib/session";

function platformAdminEmails() {
  return (process.env.YOURPLAN_ADMIN_EMAILS || process.env.OWNER_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPlatformAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN" || user.businessId) return null;

  // HQ access fails closed: a platform ADMIN record alone is not enough.
  // The signed-in email must also be explicitly allowlisted in production.
  const allowed = platformAdminEmails();
  if (allowed.length === 0) return null;
  return allowed.includes(user.email.toLowerCase()) ? user : null;
}
