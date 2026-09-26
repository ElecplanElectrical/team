ALTER TABLE "JobMaterial" ADD COLUMN "stockAppliedAt" TIMESTAMP(3);

CREATE INDEX "JobMaterial_stockAppliedAt_idx" ON "JobMaterial"("stockAppliedAt");
