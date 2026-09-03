CREATE TABLE "JobSiteLog" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "issues" TEXT,
  "stage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobSiteLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobSiteLog_jobId_createdAt_idx" ON "JobSiteLog"("jobId", "createdAt");
ALTER TABLE "JobSiteLog" ADD CONSTRAINT "JobSiteLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobSiteLog" ADD CONSTRAINT "JobSiteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
