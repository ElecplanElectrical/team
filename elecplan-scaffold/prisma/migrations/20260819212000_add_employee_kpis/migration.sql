CREATE TABLE "EmployeeKpi" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeKpi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmployeeKpi_userId_active_idx" ON "EmployeeKpi"("userId", "active");
ALTER TABLE "EmployeeKpi" ADD CONSTRAINT "EmployeeKpi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
