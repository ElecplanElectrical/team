import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, landingPath, type Screen } from "@/lib/access";

/** Server-component guard: ensure a session exists, else redirect to login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Server-component guard: ensure the user's role may view `screen`. */
export async function requireAccess(screen: Screen) {
  const user = await requireUser();
  if (!canAccess(user.role, screen)) redirect(landingPath(user.role));
  return user;
}

/** API-route helper: returns the session user or null (no redirect). */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
