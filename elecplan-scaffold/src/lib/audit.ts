import type { AuditLog, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditActor = {
  id?: string | null;
  email?: string | null;
};

type AuditEntry = {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

export async function recordAudit(entry: AuditEntry): Promise<boolean> {
  try {
    const details = JSON.parse(JSON.stringify(entry.details ?? {})) as Prisma.InputJsonValue;
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor.id ?? null,
        actorEmail: entry.actor.email ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details,
      },
    });
    return true;
  } catch (error) {
    console.error("AUDIT_LOG_WRITE_FAILED", error);
    return false;
  }
}

export type AuditRow = AuditLog;

export async function recentAuditRowsForBusiness(businessId: string, limit = 200): Promise<AuditRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const tenantUsers = await prisma.user.findMany({
    where: { businessId },
    select: { id: true },
  });
  const actorIds = tenantUsers.map((user) => user.id);
  return prisma.auditLog.findMany({
    where: {
      OR: [
        ...(actorIds.length ? [{ actorId: { in: actorIds } }] : []),
        { details: { path: ["businessId"], equals: businessId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: safeLimit,
  });
}
