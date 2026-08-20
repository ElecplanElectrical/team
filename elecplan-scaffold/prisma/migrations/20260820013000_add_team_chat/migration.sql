-- Team chat messages
CREATE TABLE "TeamChatMessage" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeamChatMessage_createdAt_idx" ON "TeamChatMessage"("createdAt");
CREATE INDEX "TeamChatMessage_senderId_createdAt_idx" ON "TeamChatMessage"("senderId", "createdAt");
ALTER TABLE "TeamChatMessage" ADD CONSTRAINT "TeamChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-user read cursor for unread badges
CREATE TABLE "TeamChatReadState" (
  "userId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamChatReadState_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "TeamChatReadState" ADD CONSTRAINT "TeamChatReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Web-push subscriptions, one row per browser/device endpoint
CREATE TABLE "PushSubscription" (
  "endpoint" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("endpoint")
);
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
