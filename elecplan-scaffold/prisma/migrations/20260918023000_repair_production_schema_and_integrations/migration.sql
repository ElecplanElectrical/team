-- Repair historical schema drift without deleting legacy Elecplan data.
-- The portal source had moved to new field/model names while production still
-- contained the original tables. Every conversion below is additive and
-- backfills the current Prisma shape before enforcing required columns.

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorName" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorRole" TEXT;

ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMP(3);
ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Timesheet" SET "weekStart" = COALESCE("weekStart", "date", CURRENT_TIMESTAMP) WHERE "weekStart" IS NULL;
ALTER TABLE "Timesheet" ALTER COLUMN "weekStart" SET NOT NULL;
ALTER TABLE "Timesheet" ALTER COLUMN "date" DROP NOT NULL;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "kind" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
UPDATE "Document" SET
  "url" = COALESCE("url", "fileUrl", '/unavailable'),
  "mimeType" = COALESCE("mimeType", "contentType"),
  "kind" = COALESCE("kind", "type"),
  "createdAt" = COALESCE("createdAt", "uploadedAt", CURRENT_TIMESTAMP);
ALTER TABLE "Document" ALTER COLUMN "url" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Document" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "fileUrl" DROP NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "type" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectPhoto" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "ProjectPhoto" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "ProjectPhoto" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "ProjectPhoto" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
UPDATE "ProjectPhoto" SET
  "url" = COALESCE("url", "fileUrl", '/unavailable'),
  "mimeType" = COALESCE("mimeType", "contentType"),
  "createdAt" = COALESCE("createdAt", "uploadedAt", CURRENT_TIMESTAMP);
ALTER TABLE "ProjectPhoto" ALTER COLUMN "url" SET NOT NULL;
ALTER TABLE "ProjectPhoto" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectPhoto" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "ProjectPhoto" ALTER COLUMN "jobId" DROP NOT NULL;
ALTER TABLE "ProjectPhoto" ALTER COLUMN "fileUrl" DROP NOT NULL;

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "comment" TEXT;
UPDATE "Review" SET "comment" = COALESCE("comment", "text");
ALTER TABLE "Review" ALTER COLUMN "clientId" DROP NOT NULL;

ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "make" TEXT;
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "model" TEXT;
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "purchasePrice" DECIMAL(65,30);
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "serviceDue" TIMESTAMP(3);
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "Equipment" ADD COLUMN IF NOT EXISTS "photoMimeType" TEXT;
UPDATE "Equipment" SET
  "assignedTo" = COALESCE("assignedTo", "assignedUserId"),
  "photoMimeType" = COALESCE("photoMimeType", "photoContentType");

CREATE TABLE IF NOT EXISTS "Material" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "brand" TEXT,
  "model" TEXT,
  "sku" TEXT,
  "barcode" TEXT,
  "supplier" TEXT,
  "supplierSku" TEXT,
  "unit" TEXT,
  "stockOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "reorderPoint" DECIMAL(65,30),
  "unitCost" DECIMAL(65,30),
  "notes" TEXT,
  "photoUrl" TEXT,
  "photoStorageKey" TEXT,
  "photoMimeType" TEXT,
  "photoSizeBytes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
INSERT INTO "Material" (
  "id", "name", "model", "barcode", "supplier", "unit", "stockOnHand",
  "reorderPoint", "photoStorageKey", "photoMimeType", "photoSizeBytes"
)
SELECT
  s."id", s."name", s."modelNumber", s."barcode", s."supplier", s."unit",
  s."onHand", s."parLevel", s."photoStorageKey", s."photoContentType", s."photoSizeBytes"
FROM "StockItem" s
ON CONFLICT ("id") DO NOTHING;
CREATE INDEX IF NOT EXISTS "Material_barcode_idx" ON "Material"("barcode");

CREATE TABLE IF NOT EXISTS "ScanEnrichmentQueue" (
  "id" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "barcode" TEXT,
  "photoUrl" TEXT,
  "status" "ScanEnrichmentStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScanEnrichmentQueue_pkey" PRIMARY KEY ("id")
);
INSERT INTO "ScanEnrichmentQueue" ("id", "materialId", "barcode", "photoUrl", "status", "attempts", "lastError", "createdAt", "updatedAt")
SELECT q."id", q."stockItemId", s."barcode", q."photoStorageKey", q."status", q."attempts", q."lastError", q."createdAt", q."updatedAt"
FROM "ScanEnrichmentJob" q
LEFT JOIN "StockItem" s ON s."id" = q."stockItemId"
ON CONFLICT ("id") DO NOTHING;
CREATE INDEX IF NOT EXISTS "ScanEnrichmentQueue_status_createdAt_idx" ON "ScanEnrichmentQueue"("status", "createdAt");

ALTER TABLE "EmployeeKpi" ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMP(3);
ALTER TABLE "EmployeeKpi" ADD COLUMN IF NOT EXISTS "jobsComplete" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmployeeKpi" ADD COLUMN IF NOT EXISTS "hoursWorked" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "EmployeeKpi" ADD COLUMN IF NOT EXISTS "reworkCount" INTEGER NOT NULL DEFAULT 0;
WITH numbered AS (
  SELECT "id", "createdAt" + (ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt", "id") - 1) * INTERVAL '1 second' AS value
  FROM "EmployeeKpi"
)
UPDATE "EmployeeKpi" k SET "weekStart" = numbered.value FROM numbered WHERE k."id" = numbered."id" AND k."weekStart" IS NULL;
ALTER TABLE "EmployeeKpi" ALTER COLUMN "weekStart" SET NOT NULL;
ALTER TABLE "EmployeeKpi" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "EmployeeKpi" ALTER COLUMN "target" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeKpi_userId_weekStart_key" ON "EmployeeKpi"("userId", "weekStart");
CREATE INDEX IF NOT EXISTS "EmployeeKpi_weekStart_idx" ON "EmployeeKpi"("weekStart");

ALTER TABLE "WeeklyGoal" ADD COLUMN IF NOT EXISTS "target" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "WeeklyGoal" ALTER COLUMN "text" DROP NOT NULL;

ALTER TABLE "SmsLog" ADD COLUMN IF NOT EXISTS "to" TEXT;
UPDATE "SmsLog" SET "to" = COALESCE("to", "phoneNumber") WHERE "to" IS NULL;
ALTER TABLE "SmsLog" ALTER COLUMN "to" SET NOT NULL;
ALTER TABLE "SmsLog" ALTER COLUMN "phoneNumber" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "QuoteLine" (
  "id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JobTask" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "JobMaterial" ADD COLUMN IF NOT EXISTS "materialId" TEXT;
UPDATE "JobMaterial" SET "materialId" = "id" WHERE "materialId" IS NULL;
ALTER TABLE "JobMaterial" ALTER COLUMN "materialId" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "TeamMessage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TeamMessage_createdAt_idx" ON "TeamMessage"("createdAt");
CREATE TABLE IF NOT EXISTS "TeamMessageRead" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamMessageRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMessageRead_messageId_userId_key" ON "TeamMessageRead"("messageId", "userId");
CREATE INDEX IF NOT EXISTS "TeamMessageRead_userId_readAt_idx" ON "TeamMessageRead"("userId", "readAt");

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "xeroContactId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Client_xeroContactId_key" ON "Client"("xeroContactId");

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "documentStorageKey" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "documentMimeType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "documentSizeBytes" INTEGER;

CREATE TABLE IF NOT EXISTS "XeroConnection" (
  "id" TEXT NOT NULL DEFAULT 'elecplan',
  "tenantId" TEXT NOT NULL,
  "tenantName" TEXT NOT NULL,
  "accessTokenCiphertext" TEXT NOT NULL,
  "refreshTokenCiphertext" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "scopes" TEXT NOT NULL,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XeroConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "XeroConnection_tenantId_key" ON "XeroConnection"("tenantId");
