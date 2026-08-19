ALTER TABLE "JobEvent" ADD COLUMN "notes" TEXT;

CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyGoal_weekStart_key" ON "WeeklyGoal"("weekStart");
