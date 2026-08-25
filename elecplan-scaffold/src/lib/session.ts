import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccess, landingPath, type Screen } from "@/lib/access";

async function currentActiveUser() {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true, active: true, businessId: true },
  });

  if (!user?.active) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
  };
}

/** Server-component guard: ensure a current active user exists, else redirect to login. */
export async function requireUser() {
  const user = await currentActiveUser();
  if (!user) redirect("/login");
  return user;
}

/** Server-component guard: ensure the user's current database role may view `screen`. */
export async function requireAccess(screen: Screen) {
  const user = await requireUser();
  if (!canAccess(user.role, screen)) redirect(landingPath(user.role));
  return user;
}

/** API-route helper: returns the current active database user or null. */
export async function getSessionUser() {
  return currentActiveUser();
}
