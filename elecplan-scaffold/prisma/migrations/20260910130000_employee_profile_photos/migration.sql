CREATE TABLE "EmployeeProfilePhoto" (
  "userId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "originalName" TEXT,
  "sizeBytes" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmployeeProfilePhoto_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "EmployeeProfilePhoto"
  ADD CONSTRAINT "EmployeeProfilePhoto_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
