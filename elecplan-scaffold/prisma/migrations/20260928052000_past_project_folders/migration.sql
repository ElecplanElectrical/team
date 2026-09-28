ALTER TABLE "Project" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Project" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Document" ADD COLUMN "projectId" TEXT;

CREATE UNIQUE INDEX "Project_jobId_key" ON "Project"("jobId");
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

ALTER TABLE "Project" ADD CONSTRAINT "Project_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
