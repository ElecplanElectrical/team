ALTER TABLE "Document"
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER;

ALTER TABLE "ProjectPhoto"
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER;

CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE UNIQUE INDEX "ProjectPhoto_storageKey_key" ON "ProjectPhoto"("storageKey");
