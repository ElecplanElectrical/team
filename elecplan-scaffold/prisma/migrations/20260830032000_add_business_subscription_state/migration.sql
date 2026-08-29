-- Provider-neutral subscription state for YourPlan customers.
CREATE TABLE IF NOT EXISTS "BusinessSubscription" (
  "businessId" TEXT PRIMARY KEY REFERENCES "BusinessPortal"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "setupFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
  "graceEndsAt" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
  "cancelledAt" TIMESTAMP(3),
  "provider" TEXT,
  "providerCustomerId" TEXT,
  "providerSubscriptionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessSubscription_status_check" CHECK ("status" IN ('ACTIVE','TRIAL','GRACE','PAST_DUE','SUSPENDED','CANCELLED')),
  CONSTRAINT "BusinessSubscription_grace_days_check" CHECK ("gracePeriodDays" >= 0 AND "gracePeriodDays" <= 90)
);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessSubscription_providerSubscriptionId_key"
  ON "BusinessSubscription"("providerSubscriptionId") WHERE "providerSubscriptionId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "BusinessSubscription_status_idx" ON "BusinessSubscription"("status");
CREATE INDEX IF NOT EXISTS "BusinessSubscription_graceEndsAt_idx" ON "BusinessSubscription"("graceEndsAt");

-- Existing customers remain active. This is idempotent and does not change their current portal access.
INSERT INTO "BusinessSubscription" ("businessId", "status", "setupFee", "gracePeriodDays")
SELECT id, 'ACTIVE', 0, 7 FROM "BusinessPortal"
ON CONFLICT ("businessId") DO NOTHING;
