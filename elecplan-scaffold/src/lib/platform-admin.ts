import { getSessionUser } from "@/lib/session";

function platformAdminEmails() {
  return (process.env.YOURPLAN_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPlatformAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN" || user.businessId) return null;

  const allowed = platformAdminEmails();
  if (allowed.length > 0) {
    return allowed.includes(user.email.toLowerCase()) ? user : null;
  }

  // Platform users live outside a customer business. This remains stable as
  // customer ADMIN users are created and prevents them from gaining HQ access.
  return user;
}
