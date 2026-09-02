-- Add platform-owner payment and onboarding document management.
CREATE TABLE IF NOT EXISTS "PlatformPayment" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dueDate" TIMESTAMP(3),
  "paymentDate" TIMESTAMP(3),
  "method" TEXT,
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformPayment_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "PlatformPayment_status_check" CHECK ("status" IN ('PENDING','PAID','OVERDUE','REFUNDED','VOID'))
);

CREATE INDEX IF NOT EXISTS "PlatformPayment_businessId_createdAt_idx"
  ON "PlatformPayment"("businessId", "createdAt");

CREATE TABLE IF NOT EXISTS "PlatformDocument" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalName" TEXT,
  "contentType" TEXT,
  "sizeBytes" INTEGER,
  "notes" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformDocument_storageKey_key" UNIQUE ("storageKey"),
  CONSTRAINT "PlatformDocument_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PlatformDocument_businessId_uploadedAt_idx"
  ON "PlatformDocument"("businessId", "uploadedAt");
