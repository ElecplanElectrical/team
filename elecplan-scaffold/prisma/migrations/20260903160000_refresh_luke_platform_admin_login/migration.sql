-- Make Luke Phillips the permanent YourPlan platform administrator.
-- The account is intentionally detached from every customer business.
-- Only the SHA-256 hash of the single-use setup token is stored here.

DO $$
DECLARE
  platform_user_id text;
  platform_user_has_password boolean;
  platform_user_matches integer;
BEGIN
  SELECT COUNT(*)
  INTO platform_user_matches
  FROM "User"
  WHERE lower("email") = 'luke@elecplan.com.au';

  IF platform_user_matches > 1 THEN
    RAISE EXCEPTION 'Multiple case-variant Luke accounts found; refusing to choose one';
  END IF;

  SELECT "id", ("passwordHash" IS NOT NULL)
  INTO platform_user_id, platform_user_has_password
  FROM "User"
  WHERE lower("email") = 'luke@elecplan.com.au'
  LIMIT 1;

  IF platform_user_id IS NULL THEN
    platform_user_id := '4fe4d506-b76a-4391-9134-fe5679aa7329';
    platform_user_has_password := FALSE;

    INSERT INTO "User" (
      "id", "name", "email", "role", "passwordHash", "active", "createdAt", "businessId"
    ) VALUES (
      platform_user_id,
      'Luke Phillips',
      'luke@elecplan.com.au',
      'ADMIN',
      NULL,
      TRUE,
      CURRENT_TIMESTAMP,
      NULL
    );
  ELSE
    UPDATE "User"
    SET
      "name" = 'Luke Phillips',
      "email" = 'luke@elecplan.com.au',
      "role" = 'ADMIN',
      "active" = TRUE,
      "businessId" = NULL
    WHERE "id" = platform_user_id;
  END IF;

  DELETE FROM "PasswordToken"
  WHERE "userId" = platform_user_id
    AND "usedAt" IS NULL;

  INSERT INTO "PasswordToken" (
    "id", "userId", "tokenHash", "type", "expiresAt", "usedAt", "createdAt"
  ) VALUES (
    '1a4f46a0-3e7e-45b1-b6bf-bd671f1e0b3f',
    platform_user_id,
    'c9a49ddcc2951af82c74f65cf15bed567cb720d916be66859e91a7c0b64b517e',
    (CASE WHEN platform_user_has_password THEN 'RESET' ELSE 'INVITE' END)::"PasswordTokenType",
    CURRENT_TIMESTAMP + INTERVAL '72 hours',
    NULL,
    CURRENT_TIMESTAMP
  );

  -- Retire the temporary placeholder now that the real owner login is established.
  UPDATE "User"
  SET "active" = FALSE
  WHERE lower("email") = 'hq@your-plan.com.au'
    AND "businessId" IS NULL;

  DELETE FROM "PasswordToken"
  WHERE "userId" IN (
    SELECT "id"
    FROM "User"
    WHERE lower("email") = 'hq@your-plan.com.au'
      AND "businessId" IS NULL
  )
    AND "usedAt" IS NULL;

  INSERT INTO "AuditLog" (
    "id", "actorId", "actorEmail", "action", "entityType", "entityId", "details", "createdAt"
  ) VALUES (
    'f3ed8614-9476-45ae-8499-99413d0981f6',
    NULL,
    NULL,
    'PLATFORM_ADMIN_SETUP_LINK_ISSUED',
    'User',
    platform_user_id,
    jsonb_build_object(
      'email', 'luke@elecplan.com.au',
      'role', 'ADMIN',
      'businessScoped', FALSE,
      'expiresInHours', 72,
      'placeholderRetired', TRUE
    ),
    CURRENT_TIMESTAMP
  );
END $$;

