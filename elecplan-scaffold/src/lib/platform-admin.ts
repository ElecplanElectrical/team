import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function platformAdminEmails() {
  return (process.env.YOURPLAN_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPlatformAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;

  const allowed = platformAdminEmails();
  if (allowed.length > 0) return allowed.includes(user.email.toLowerCase()) ? user : null;

  // Bootstrap only an existing single-admin install. Once another active admin
  // exists, an explicit YOURPLAN_ADMIN_EMAILS allow-list is required.
  const activeAdmins = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true },
    take: 2,
  });
  return activeAdmins.length === 1 && activeAdmins[0]?.id === user.id ? user : null;
}
