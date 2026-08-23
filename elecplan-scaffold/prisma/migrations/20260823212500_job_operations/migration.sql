CREATE TABLE "JobTask" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobTask_jobId_sortOrder_idx" ON "JobTask"("jobId", "sortOrder");
ALTER TABLE "JobTask" ADD CONSTRAINT "JobTask_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "JobMaterial" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unit" TEXT,
  "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "unitSell" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobMaterial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobMaterial_jobId_idx" ON "JobMaterial"("jobId");
ALTER TABLE "JobMaterial" ADD CONSTRAINT "JobMaterial_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
