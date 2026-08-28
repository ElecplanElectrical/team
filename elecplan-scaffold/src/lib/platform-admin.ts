import { getSessionUser } from "@/lib/session";

function platformAdminEmails() {
  return (process.env.YOURPLAN_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPlatformAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const allowed = platformAdminEmails();
  if (!allowed.includes(user.email.toLowerCase())) return null;
  return user;
}
