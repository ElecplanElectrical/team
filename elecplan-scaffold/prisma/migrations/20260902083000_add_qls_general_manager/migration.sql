-- Add Lachlan Clark as QLS General Manager Admin and issue a secure setup link.
DO $$
DECLARE
  qls_business_id text;
  qls_manager_id text;
  qls_manager_has_password boolean;
  existing_business_id text;
BEGIN
  SELECT id INTO qls_business_id
  FROM "BusinessPortal"
  WHERE slug = 'qls'
  LIMIT 1;

  IF qls_business_id IS NULL THEN
    RAISE EXCEPTION 'QLS business portal missing; refusing to create manager account';
  END IF;

  SELECT "businessId" INTO existing_business_id
  FROM "User"
  WHERE lower(email) = 'qlslachc@outlook.com'
  LIMIT 1;

  IF FOUND AND existing_business_id IS DISTINCT FROM qls_business_id THEN
    RAISE EXCEPTION 'Email already belongs to a different business; refusing reassignment';
  END IF;

  SELECT id INTO qls_manager_id
  FROM "User"
  WHERE lower(email) = 'qlslachc@outlook.com'
  LIMIT 1;

  IF qls_manager_id IS NULL THEN
    INSERT INTO "User" (
      id, name, email, phone, role, "passwordHash", active, "createdAt", "businessId"
    ) VALUES (
      '741b62c8-8ff0-41de-9ebf-c4c54a82c437',
      'Lachlan Clark',
      'qlslachc@outlook.com',
      NULL,
      'ADMIN'::"Role",
      NULL,
      TRUE,
      NOW(),
      qls_business_id
    )
    RETURNING id INTO qls_manager_id;
  ELSE
    UPDATE "User"
    SET
      name = 'Lachlan Clark',
      email = 'qlslachc@outlook.com',
      role = 'ADMIN'::"Role",
      active = TRUE,
      "businessId" = qls_business_id
    WHERE id = qls_manager_id;
  END IF;

  SELECT ("passwordHash" IS NOT NULL)
  INTO qls_manager_has_password
  FROM "User"
  WHERE id = qls_manager_id;

  DELETE FROM "PasswordToken"
  WHERE "userId" = qls_manager_id AND "usedAt" IS NULL;

  INSERT INTO "PasswordToken" (
    id, "userId", "tokenHash", type, "expiresAt", "usedAt", "createdAt"
  ) VALUES (
    '2f91b797-8083-47ca-a987-dcd6b4915b9d',
    qls_manager_id,
    'e65bd62b674356f7ed883a24e9fa3f251bc21878ecf5c225aeab405dc3fae16a',
    (CASE WHEN qls_manager_has_password THEN 'RESET' ELSE 'INVITE' END)::"PasswordTokenType",
    NOW() + INTERVAL '72 hours',
    NULL,
    NOW()
  );

  INSERT INTO "AuditLog" (
    id, "actorId", "actorEmail", action, "entityType", "entityId", details, "createdAt"
  ) VALUES (
    '7dd91db7-0514-4a17-a9fb-501e1dfc4280',
    NULL,
    NULL,
    'PLATFORM_GENERAL_MANAGER_SETUP_LINK_ISSUED',
    'User',
    qls_manager_id,
    jsonb_build_object(
      'businessName', 'Quality Landscape Solutions Pty Ltd',
      'role', 'General Manager Admin',
      'email', 'qlslachc@outlook.com',
      'expiresInHours', 72,
      'source', 'QLS launch readiness'
    ),
    NOW()
  );
END $$;
