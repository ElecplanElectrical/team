-- Align the production Reminder table with the current Prisma model without deleting legacy data.
ALTER TABLE "Reminder"
  ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);

ALTER TABLE "Reminder"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Reminder'
      AND column_name = 'dueDate'
  ) THEN
    EXECUTE 'UPDATE "Reminder"
             SET "dueAt" = COALESCE("dueAt", "dueDate", CURRENT_TIMESTAMP)
             WHERE "dueAt" IS NULL';
  ELSE
    UPDATE "Reminder"
    SET "dueAt" = CURRENT_TIMESTAMP
    WHERE "dueAt" IS NULL;
  END IF;
END
$$;

ALTER TABLE "Reminder"
  ALTER COLUMN "dueAt" SET NOT NULL;
