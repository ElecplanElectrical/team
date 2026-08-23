DO $$ BEGIN
  CREATE TYPE "ScanEnrichmentStatus" AS ENUM ('PENDING','PROCESSING','DONE','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ScanEnrichmentJob" (
  "id" TEXT NOT NULL,
  "stockItemId" TEXT NOT NULL,
  "photoStorageKey" TEXT NOT NULL,
  "status" "ScanEnrichmentStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScanEnrichmentJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScanEnrichmentJob_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ScanEnrichmentJob_status_createdAt_idx" ON "ScanEnrichmentJob"("status","createdAt");
CREATE INDEX IF NOT EXISTS "ScanEnrichmentJob_stockItemId_idx" ON "ScanEnrichmentJob"("stockItemId");