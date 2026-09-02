-- Refresh the secure QLS owner setup link for launch.
DO $$
DECLARE
  qls_owner_id text;
  qls_owner_has_password boolean;
BEGIN
  SELECT id, ("passwordHash" IS NOT NULL)
  INTO qls_owner_id, qls_owner_has_password
  FROM "User"
  WHERE lower(email) = 'lachlan.jepsen@outlook.com'
    AND active = true
  LIMIT 1;

  IF qls_owner_id IS NULL THEN
    RAISE EXCEPTION 'QLS owner account missing; refusing to issue setup link';
  END IF;

  DELETE FROM "PasswordToken"
  WHERE "userId" = qls_owner_id AND "usedAt" IS NULL;

  INSERT INTO "PasswordToken" (
    id, "userId", "tokenHash", type, "expiresAt", "usedAt", "createdAt"
  ) VALUES (
    'e915d7b5-b0f1-4f2c-b754-6542fbbc64c3',
    qls_owner_id,
    '70a3d2139ba712392aee8d5fef6d6757aac9b83adbae8266a2f2a1be5d63f3f1',
    (CASE WHEN qls_owner_has_password THEN 'RESET' ELSE 'INVITE' END)::"PasswordTokenType",
    NOW() + INTERVAL '72 hours',
    NULL,
    NOW()
  );

  INSERT INTO "AuditLog" (
    id, "actorId", "actorEmail", action, "entityType", "entityId", details, "createdAt"
  ) VALUES (
    'f86869a3-d612-42c5-9982-9c8d82bd47b0',
    NULL,
    NULL,
    'PLATFORM_OWNER_SETUP_LINK_ISSUED',
    'User',
    qls_owner_id,
    jsonb_build_object(
      'businessName', 'Quality Landscape Solutions Pty Ltd',
      'ownerEmail', 'lachlan.jepsen@outlook.com',
      'expiresInHours', 72,
      'source', 'QLS launch readiness'
    ),
    NOW()
  );
END $$;
