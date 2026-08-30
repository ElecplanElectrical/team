-- Ensure YourPlan HQ has a dedicated platform admin onboarding account.
-- This user is not attached to any customer business and receives a single-use setup token.

INSERT INTO "User" (
  "id", "name", "email", "role", "passwordHash", "active", "createdAt", "businessId"
) VALUES (
  '00000000-0000-4000-8000-000000000900',
  'YourPlan HQ Admin',
  'hq@your-plan.com.au',
  'ADMIN',
  NULL,
  TRUE,
  CURRENT_TIMESTAMP,
  NULL
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = 'ADMIN',
  "active" = TRUE,
  "businessId" = NULL;

DELETE FROM "PasswordToken"
WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'hq@your-plan.com.au')
  AND "usedAt" IS NULL;

INSERT INTO "PasswordToken" (
  "id", "userId", "tokenHash", "type", "expiresAt", "createdAt"
)
SELECT
  '00000000-0000-4000-8000-000000000901',
  "id",
  '8339bfdbe90492439662934827a77b14be635251371fafa356c3769e38510a3d',
  'INVITE',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'hq@your-plan.com.au'
ON CONFLICT ("tokenHash") DO NOTHING;
