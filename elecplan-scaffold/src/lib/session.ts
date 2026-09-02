import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccess, firstAccessibleModulePath, landingPath, moduleForScreen, type Screen } from "@/lib/access";
import { DEFAULT_MODULES, type YourPlanModule } from "@/lib/brand";
import { getBusinessSubscription, subscriptionAllowsAccess } from "@/lib/subscription";

const MODULES = new Set<YourPlanModule>(DEFAULT_MODULES);

async function inferredModule(): Promise<YourPlanModule | undefined> {
  try {
    const value = (await headers()).get("x-yourplan-required-module");
    return value && MODULES.has(value as YourPlanModule) ? value as YourPlanModule : undefined;
  } catch {
    return undefined;
  }
}

async function currentActiveUser(requiredModule?: YourPlanModule) {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true, name: true, email: true, role: true, active: true, businessId: true,
      business: { select: { active: true, name: true, slug: true, logoUrl: true, primaryColor: true, accentColor: true, modules: true } },
    },
  });

  if (!user?.active || (user.businessId && !user.business?.active)) return null;

  if (user.businessId) {
    const subscription = await getBusinessSubscription(user.businessId);
    if (!subscriptionAllowsAccess(subscription)) return null;
  }

  const modules = Array.isArray(user.business?.modules)
    ? user.business.modules.filter((value): value is YourPlanModule => typeof value === "string" && MODULES.has(value as YourPlanModule))
    : [...DEFAULT_MODULES];

  const module = requiredModule ?? await inferredModule();
  if (module && user.businessId && !modules.includes(module)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    business: user.business ? {
      name: user.business.name,
      slug: user.business.slug,
      logoUrl: user.business.slug === "qls" ? "https://landscaping-melbourne.com.au/wp-content/uploads/2026/03/QLS-Logo.jpg" : user.business.logoUrl,
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
    redirect(firstAccessibleModulePath(user.role, user.business.modules));
  }
  return user;
}

export async function getSessionUser(requiredModule?: YourPlanModule) {
  return currentActiveUser(requiredModule);
}
