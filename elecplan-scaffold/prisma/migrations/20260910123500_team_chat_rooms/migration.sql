-- Named/private team chat rooms with optional job links.
CREATE TABLE "TeamChatRoom" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "jobId" TEXT,
  "isGeneral" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamChatRoom_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeamChatRoom_businessId_updatedAt_idx" ON "TeamChatRoom"("businessId", "updatedAt");
CREATE UNIQUE INDEX "TeamChatRoom_businessId_general_key" ON "TeamChatRoom"("businessId") WHERE "isGeneral" = TRUE;
ALTER TABLE "TeamChatRoom" ADD CONSTRAINT "TeamChatRoom_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamChatRoom" ADD CONSTRAINT "TeamChatRoom_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamChatRoom" ADD CONSTRAINT "TeamChatRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TeamChatRoomMember" (
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamChatRoomMember_pkey" PRIMARY KEY ("roomId", "userId")
);
CREATE INDEX "TeamChatRoomMember_userId_idx" ON "TeamChatRoomMember"("userId");
ALTER TABLE "TeamChatRoomMember" ADD CONSTRAINT "TeamChatRoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TeamChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamChatRoomMember" ADD CONSTRAINT "TeamChatRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create one permanent all-staff room per customer business.
INSERT INTO "TeamChatRoom" ("id", "businessId", "name", "isGeneral")
SELECT 'general-' || b."id", b."id", CASE WHEN b."slug" = 'qls' THEN 'QLS Team' ELSE b."name" || ' Team' END, TRUE
FROM "BusinessPortal" b
WHERE EXISTS (SELECT 1 FROM "User" u WHERE u."businessId" = b."id")
ON CONFLICT DO NOTHING;

-- Move all existing chat history into each tenant's permanent general room.
ALTER TABLE "TeamChatMessage" ADD COLUMN "roomId" TEXT;
UPDATE "TeamChatMessage" m
SET "roomId" = r."id"
FROM "TeamChatRoom" r
WHERE r."businessId" = m."businessId" AND r."isGeneral" = TRUE;
ALTER TABLE "TeamChatMessage" ALTER COLUMN "roomId" SET NOT NULL;
CREATE INDEX "TeamChatMessage_roomId_createdAt_idx" ON "TeamChatMessage"("roomId", "createdAt");
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TeamChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Read cursors now belong to an individual room, not the entire business chat.
ALTER TABLE "TeamChatReadState" ADD COLUMN "roomId" TEXT;
UPDATE "TeamChatReadState" s
SET "roomId" = r."id"
FROM "User" u, "TeamChatRoom" r
WHERE u."id" = s."userId" AND r."businessId" = u."businessId" AND r."isGeneral" = TRUE;
DELETE FROM "TeamChatReadState" WHERE "roomId" IS NULL;
ALTER TABLE "TeamChatReadState" ALTER COLUMN "roomId" SET NOT NULL;
ALTER TABLE "TeamChatReadState" DROP CONSTRAINT "TeamChatReadState_pkey";
ALTER TABLE "TeamChatReadState" ADD CONSTRAINT "TeamChatReadState_pkey" PRIMARY KEY ("userId", "roomId");
ALTER TABLE "TeamChatReadState" ADD CONSTRAINT "TeamChatReadState_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "TeamChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
