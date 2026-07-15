-- DropForeignKey
ALTER TABLE "JobEvent" DROP CONSTRAINT "JobEvent_jobId_fkey";

-- AlterTable
ALTER TABLE "JobEvent" ADD COLUMN     "title" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
