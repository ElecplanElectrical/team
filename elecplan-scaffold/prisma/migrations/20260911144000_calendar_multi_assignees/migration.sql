CREATE TABLE IF NOT EXISTS "JobEventAssignee" (
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "JobEventAssignee_pkey" PRIMARY KEY ("eventId", "userId"),
  CONSTRAINT "JobEventAssignee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "JobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "JobEventAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "JobEventAssignee_userId_eventId_idx" ON "JobEventAssignee"("userId", "eventId");
INSERT INTO "JobEventAssignee" ("eventId", "userId")
SELECT "id", "assignedToId" FROM "JobEvent" WHERE "assignedToId" IS NOT NULL
ON CONFLICT DO NOTHING;
