-- Stage 8 launch: issue Lachlan Jepsen a fresh one-time 72-hour setup invite.
-- The raw token is not stored; only its SHA-256 hash is persisted.
DO $$
DECLARE
  qls_owner_id text;
  qls_owner_password text;
BEGIN
  SELECT id, "passwordHash"
  INTO qls_owner_id, qls_owner_password
  FROM "User"
  WHERE lower(email) = 'lachlan.jepsen@outlook.com'
    AND active = true
  LIMIT 1;

  IF qls_owner_id IS NULL THEN
    RAISE EXCEPTION 'QLS owner account missing; refusing to issue launch invite';
  END IF;

  IF qls_owner_password IS NULL THEN
    DELETE FROM "PasswordToken"
    WHERE "userId" = qls_owner_id AND "usedAt" IS NULL;

    INSERT INTO "PasswordToken" (
      id, "userId", "tokenHash", type, "expiresAt", "usedAt", "createdAt"
    ) VALUES (
      'b6f3a8bb-79f6-4e52-98c8-58dc1bcd0778',
      qls_owner_id,
      '920ca1cb9fe5cce12864b1cc6aaf2ba9cb2f9963cf2d97451047cbebc749ea03',
      'INVITE'::"PasswordTokenType",
      NOW() + INTERVAL '72 hours',
      NULL,
      NOW()
    );

    INSERT INTO "AuditLog" (
      id, "actorId", "actorEmail", action, "entityType", "entityId", details, "createdAt"
    ) VALUES (
      '29ec6bbc-360c-4a43-a9b9-8b66101f299e',
      NULL,
      NULL,
      'PLATFORM_OWNER_SETUP_LINK_ISSUED',
      'User',
      qls_owner_id,
      jsonb_build_object(
        'businessName', 'Quality Landscape Solutions Pty Ltd',
        'ownerEmail', 'lachlan.jepsen@outlook.com',
        'tokenType', 'INVITE',
        'expiresInHours', 72,
        'source', 'Stage 8 Jepsen launch'
      ),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
