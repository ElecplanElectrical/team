CREATE TABLE IF NOT EXISTS "PlatformLead" (
  "id" TEXT PRIMARY KEY,
  "contactName" TEXT NOT NULL,
  "businessName" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "industry" TEXT,
  "teamSize" TEXT,
  "message" TEXT,
  "source" TEXT NOT NULL DEFAULT 'YOURPLAN_WEBSITE',
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PlatformLead_status_createdAt_idx" ON "PlatformLead" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformLead_email_idx" ON "PlatformLead" ("email");
