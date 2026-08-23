ALTER TABLE "StockItem" ADD COLUMN IF NOT EXISTS "modelNumber" TEXT;
CREATE INDEX IF NOT EXISTS "StockItem_modelNumber_idx" ON "StockItem" ("modelNumber");

CREATE TABLE IF NOT EXISTS "StockBarcode" (
  "barcode" TEXT PRIMARY KEY,
  "stockItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockBarcode_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "StockBarcode_stockItemId_idx" ON "StockBarcode" ("stockItemId");

INSERT INTO "StockBarcode" ("barcode", "stockItemId")
SELECT "barcode", "id" FROM "StockItem" WHERE "barcode" IS NOT NULL
ON CONFLICT ("barcode") DO NOTHING;

UPDATE "ScanEnrichmentJob"
SET "status"='PENDING', "attempts"=0, "lastError"=NULL
WHERE "status" IN ('DONE','FAILED');
