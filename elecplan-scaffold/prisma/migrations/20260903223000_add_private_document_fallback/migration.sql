ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "fileData" BYTEA;

ALTER TABLE "ProjectPhoto"
ADD COLUMN IF NOT EXISTS "fileData" BYTEA;

ALTER TABLE "Equipment"
ADD COLUMN IF NOT EXISTS "photoData" BYTEA;

ALTER TABLE "StockItem"
ADD COLUMN IF NOT EXISTS "photoData" BYTEA;

-- Barcodes identify stock inside one customer business, not across the whole platform.
DROP INDEX IF EXISTS "StockItem_barcode_key";
CREATE UNIQUE INDEX IF NOT EXISTS "StockItem_businessId_barcode_key"
ON "StockItem"("businessId", "barcode");
