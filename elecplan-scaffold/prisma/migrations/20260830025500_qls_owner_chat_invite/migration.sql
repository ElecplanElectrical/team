-- Stage 8 launch: rotate Lachlan Jepsen's invite so the raw token can be handed to the operator in-chat.
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
    RAISE EXCEPTION 'QLS owner account missing; refusing to rotate launch invite';
  END IF;

  IF qls_owner_password IS NULL THEN
    DELETE FROM "PasswordToken"
    WHERE "userId" = qls_owner_id AND "usedAt" IS NULL;

    INSERT INTO "PasswordToken" (
      id, "userId", "tokenHash", type, "expiresAt", "usedAt", "createdAt"
    ) VALUES (
      '49c71a51-a733-45af-9fd8-a50a2f427560',
      qls_owner_id,
      'd52e8a7ca629b0de5ed284a51caa61aafee886e7948377058b29b153a1237c0b',
      'INVITE'::"PasswordTokenType",
      NOW() + INTERVAL '72 hours',
      NULL,
      NOW()
    );
  END IF;
END $$;
