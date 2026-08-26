-- Permanently bind team-chat messages to the tenant they belong to.
ALTER TABLE "TeamChatMessage" ADD COLUMN "businessId" TEXT;

UPDATE "TeamChatMessage" m
SET "businessId" = u."businessId"
FROM "User" u
WHERE u."id" = m."senderId";

ALTER TABLE "TeamChatMessage" ALTER COLUMN "businessId" SET NOT NULL;
CREATE INDEX "TeamChatMessage_businessId_createdAt_idx" ON "TeamChatMessage"("businessId", "createdAt");
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
