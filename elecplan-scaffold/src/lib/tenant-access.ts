import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getPlatformAdmin } from "@/lib/platform-admin";
import type { YourPlanModule } from "@/lib/brand";

export async function requireBusinessPortal(slug: string) {
  const user = await requireUser();
  const business = await prisma.businessPortal.findUnique({ where: { slug } });
  if (!business || !business.active) notFound();

  const belongsToBusiness = user.businessId === business.id;
  const platformAdmin = await getPlatformAdmin();
  const platformOverride = platformAdmin?.id === user.id;
  if (!belongsToBusiness && !platformOverride) notFound();

  return { user, business };
}

export function businessModules(modules: unknown): YourPlanModule[] {
  if (!Array.isArray(modules)) return [];
  return modules.filter((value): value is YourPlanModule => typeof value === "string") as YourPlanModule[];
}

export async function requireBusinessModule(slug: string, module: YourPlanModule) {
  const context = await requireBusinessPortal(slug);
  const modules = businessModules(context.business.modules);
  if (!modules.includes(module)) redirect(`/b/${slug}/dashboard`);
  return { ...context, modules };
}
