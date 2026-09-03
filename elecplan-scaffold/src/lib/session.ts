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

function portalSlugForHost(hostHeader: string | null): string | null {
  const host = hostHeader?.split(":")[0]?.toLowerCase();
  if (host === "qls.your-plan.com.au") return "qls";
  return null;
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

  let effectiveBusinessId = user.businessId;
  let effectiveBusiness = user.business;
  if (!effectiveBusinessId && sessionUser.platformAdmin === true) {
    const requestHeaders = await headers();
    const portalSlug = portalSlugForHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
    if (portalSlug) {
      const portal = await prisma.businessPortal.findUnique({
        where: { slug: portalSlug },
        select: { id: true, active: true, name: true, slug: true, logoUrl: true, primaryColor: true, accentColor: true, modules: true },
      });
      if (!portal?.active) return null;
      effectiveBusinessId = portal.id;
      effectiveBusiness = portal;
    }
  }

  if (effectiveBusinessId) {
    const subscription = await getBusinessSubscription(effectiveBusinessId);
    if (!subscriptionAllowsAccess(subscription)) return null;
  }

  const modules = Array.isArray(effectiveBusiness?.modules)
    ? effectiveBusiness.modules.filter((value): value is YourPlanModule => typeof value === "string" && MODULES.has(value as YourPlanModule))
    : [...DEFAULT_MODULES];

  const requestedModule = requiredModule ?? await inferredModule();
  if (requestedModule && effectiveBusinessId && !modules.includes(requestedModule)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: effectiveBusinessId,
    business: effectiveBusiness ? {
      name: effectiveBusiness.name,
      slug: effectiveBusiness.slug,
      logoUrl: effectiveBusiness.slug === "qls" ? "/qls-logo-transparent.svg" : effectiveBusiness.logoUrl,
      primaryColor: effectiveBusiness.primaryColor,
      accentColor: effectiveBusiness.accentColor,
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
  const requiredModule = moduleForScreen(screen);
  if (requiredModule && user.business && !user.business.modules.includes(requiredModule)) {
    redirect(firstAccessibleModulePath(user.role, user.business.modules));
  }
  return user;
}

export async function getSessionUser(requiredModule?: YourPlanModule) {
  return currentActiveUser(requiredModule);
}
