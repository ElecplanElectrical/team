CREATE TABLE "BusinessPortal" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "industry" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "logoUrl" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#168dff',
  "accentColor" TEXT NOT NULL DEFAULT '#25c7ff',
  "modules" JSONB NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'CUSTOM',
  "monthlyPrice" DECIMAL(65,30),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessPortal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessPortal_slug_key" ON "BusinessPortal"("slug");
CREATE INDEX "BusinessPortal_active_createdAt_idx" ON "BusinessPortal"("active", "createdAt");
