CREATE TABLE IF NOT EXISTS "PlatformOnboarding" (
  "businessId" TEXT PRIMARY KEY,
  "abn" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "website" TEXT,
  "portalSlugRequested" TEXT,
  "customDomain" TEXT,
  "notes" TEXT,
  "workflow" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformOnboarding_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
