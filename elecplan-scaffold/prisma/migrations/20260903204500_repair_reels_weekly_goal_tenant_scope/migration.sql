-- Repair tenant columns that are present in the Prisma schema but were omitted
-- from the original ReelIdea and WeeklyGoal table migrations.

ALTER TABLE "ReelIdea"
ADD COLUMN "businessId" TEXT;

CREATE INDEX "ReelIdea_businessId_createdAt_idx"
ON "ReelIdea"("businessId", "createdAt");

ALTER TABLE "ReelIdea"
ADD CONSTRAINT "ReelIdea_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklyGoal"
ADD COLUMN "businessId" TEXT;

DROP INDEX "WeeklyGoal_weekStart_key";

CREATE UNIQUE INDEX "WeeklyGoal_businessId_weekStart_key"
ON "WeeklyGoal"("businessId", "weekStart");

CREATE INDEX "WeeklyGoal_businessId_weekStart_idx"
ON "WeeklyGoal"("businessId", "weekStart");

ALTER TABLE "WeeklyGoal"
ADD CONSTRAINT "WeeklyGoal_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
