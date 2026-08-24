import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { YourPlanModule } from "@/lib/brand";

export async function requireBusinessPortal(slug: string) {
  const user = await requireUser();
  const business = await prisma.businessPortal.findUnique({ where: { slug } });
  if (!business || !business.active) notFound();

  const isPlatformAdmin = user.role === "ADMIN" && !business.contactEmail;
  const isBusinessOwner = Boolean(
    business.contactEmail &&
    user.email &&
    business.contactEmail.toLowerCase() === user.email.toLowerCase(),
  );

  // During the initial platform build, Your Plan admins can access all tenants
  // from /platform. Customer users only get their own business.
  const platformOverride = user.role === "ADMIN";
  if (!isBusinessOwner && !platformOverride && !isPlatformAdmin) notFound();

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
