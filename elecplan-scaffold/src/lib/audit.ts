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
    const details = JSON.stringify(entry.details ?? {});
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" ("id", "actorId", "actorEmail", "action", "entityType", "entityId", "details")
      VALUES (
        ${crypto.randomUUID()},
        ${entry.actor.id ?? null},
        ${entry.actor.email ?? null},
        ${entry.action},
        ${entry.entityType},
        ${entry.entityId ?? null},
        CAST(${details} AS jsonb)
      )
    `;
    return true;
  } catch (error) {
    console.error("AUDIT_LOG_WRITE_FAILED", error);
    return false;
  }
}

export type AuditRow = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: Date;
};

export async function recentAuditRows(limit = 200): Promise<AuditRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  return prisma.$queryRaw<AuditRow[]>`
    SELECT "id", "actorId", "actorEmail", "action", "entityType", "entityId", "details", "createdAt"
    FROM "AuditLog"
    ORDER BY "createdAt" DESC
    LIMIT ${safeLimit}
  `;
}
