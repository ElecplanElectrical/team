CREATE TABLE "QuoteExclusion" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteExclusion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "JobExtra" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(65,30),
  "gstRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
  "source" TEXT NOT NULL DEFAULT 'EXTRA',
  "invoicedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JobExtra_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuoteExclusion_quoteId_idx" ON "QuoteExclusion"("quoteId");
CREATE INDEX "JobExtra_jobId_invoicedAt_idx" ON "JobExtra"("jobId","invoicedAt");
ALTER TABLE "QuoteExclusion" ADD CONSTRAINT "QuoteExclusion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobExtra" ADD CONSTRAINT "JobExtra_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
