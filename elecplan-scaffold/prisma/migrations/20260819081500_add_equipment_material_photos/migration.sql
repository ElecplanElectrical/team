ALTER TABLE "Equipment" ADD COLUMN "photoStorageKey" TEXT,
ADD COLUMN "photoOriginalName" TEXT,
ADD COLUMN "photoContentType" TEXT,
ADD COLUMN "photoSizeBytes" INTEGER;

ALTER TABLE "StockItem" ADD COLUMN "photoStorageKey" TEXT,
ADD COLUMN "photoOriginalName" TEXT,
ADD COLUMN "photoContentType" TEXT,
ADD COLUMN "photoSizeBytes" INTEGER;

CREATE UNIQUE INDEX "Equipment_photoStorageKey_key" ON "Equipment"("photoStorageKey");
CREATE UNIQUE INDEX "StockItem_photoStorageKey_key" ON "StockItem"("photoStorageKey");
