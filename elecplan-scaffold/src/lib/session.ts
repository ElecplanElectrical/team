import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccess, landingPath, moduleForScreen, type Screen } from "@/lib/access";
import { DEFAULT_MODULES, type YourPlanModule } from "@/lib/brand";

async function currentActiveUser() {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true, name: true, email: true, role: true, active: true, businessId: true,
      business: { select: { active: true, name: true, logoUrl: true, primaryColor: true, accentColor: true, modules: true } },
    },
  });

  if (!user?.active || (user.businessId && !user.business?.active)) return null;
  const modules = Array.isArray(user.business?.modules)
    ? user.business.modules.filter((value): value is YourPlanModule => typeof value === "string")
    : [...DEFAULT_MODULES];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    business: user.business ? {
      name: user.business.name,
      logoUrl: user.business.logoUrl,
      primaryColor: user.business.primaryColor,
      accentColor: user.business.accentColor,
      modules,
    } : null,
  };
}

export async function requireUser() {
  const user = await currentActiveUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAccess(screen: Screen) {
  const user = await requireUser();
  if (!canAccess(user.role, screen)) redirect(landingPath(user.role));
  const module = moduleForScreen(screen);
  if (module && user.business && !user.business.modules.includes(module)) {
    const fallback = user.business.modules.includes("dashboard") && user.role === "ADMIN" ? "/dashboard" : "/calendar";
    redirect(fallback);
  }
  return user;
}

export async function getSessionUser() {
  return currentActiveUser();
}
