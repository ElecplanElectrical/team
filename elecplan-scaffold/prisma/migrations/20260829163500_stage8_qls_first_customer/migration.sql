-- Stage 8: first genuine YourPlan customer onboarding.
-- Idempotent guards prevent a duplicate QLS tenant or owner account.
DO $$
DECLARE
  qls_business_id text;
  qls_owner_id text;
  qls_owner_password text;
BEGIN
  SELECT id INTO qls_business_id FROM "BusinessPortal" WHERE slug = 'qls' LIMIT 1;

  IF qls_business_id IS NULL THEN
    IF EXISTS (SELECT 1 FROM "User" WHERE lower(email) = 'lachlan.jepsen@outlook.com') THEN
      RAISE EXCEPTION 'QLS owner email already exists without the QLS tenant; refusing ambiguous onboarding';
    END IF;

    qls_business_id := '1792d00f-2bdf-4560-9790-fa8abce26c76';
    INSERT INTO "BusinessPortal" (
      id, name, slug, industry, "contactName", "contactEmail", "logoUrl",
      "primaryColor", "accentColor", modules, plan, "monthlyPrice", active,
      "createdAt", "updatedAt"
    ) VALUES (
      qls_business_id,
      'Quality Landscape Solutions Pty Ltd',
      'qls',
      'Landscaping / Landscape Construction',
      'Lachlan Jepsen',
      'lachlan.jepsen@outlook.com',
      NULL,
      '#3CB661',
      '#3CB661',
      '["dashboard","jobs","calendar","clients","leads","quotes","invoices","employees","timesheets","inspections","documents","materials","reminders","analytics"]'::jsonb,
      'STANDARD',
      50,
      true,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE "BusinessPortal"
    SET
      name = 'Quality Landscape Solutions Pty Ltd',
      industry = 'Landscaping / Landscape Construction',
      "contactName" = 'Lachlan Jepsen',
      "contactEmail" = 'lachlan.jepsen@outlook.com',
      "primaryColor" = '#3CB661',
      "accentColor" = '#3CB661',
      modules = '["dashboard","jobs","calendar","clients","leads","quotes","invoices","employees","timesheets","inspections","documents","materials","reminders","analytics"]'::jsonb,
      plan = 'STANDARD',
      "monthlyPrice" = 50,
      active = true,
      "updatedAt" = NOW()
    WHERE id = qls_business_id;
  END IF;

  SELECT id, "passwordHash" INTO qls_owner_id, qls_owner_password
  FROM "User"
  WHERE lower(email) = 'lachlan.jepsen@outlook.com'
  LIMIT 1;

  IF qls_owner_id IS NULL THEN
    qls_owner_id := '5ae994f6-c587-4a6c-bd1b-8f03ce662ffe';
    INSERT INTO "User" (
      id, name, email, phone, role, "passwordHash", active, "businessId", "createdAt"
    ) VALUES (
      qls_owner_id,
      'Lachlan Jepsen',
      'lachlan.jepsen@outlook.com',
      '0420671816',
      'ADMIN'::"Role",
      NULL,
      true,
      qls_business_id,
      NOW()
    );
    qls_owner_password := NULL;
  ELSE
    IF (SELECT "businessId" FROM "User" WHERE id = qls_owner_id) IS DISTINCT FROM qls_business_id THEN
      RAISE EXCEPTION 'QLS owner email belongs to another tenant; refusing cross-tenant reassignment';
    END IF;
    UPDATE "User"
    SET name = 'Lachlan Jepsen', phone = '0420671816', role = 'ADMIN'::"Role", active = true
    WHERE id = qls_owner_id;
  END IF;

  IF qls_owner_password IS NULL THEN
    DELETE FROM "PasswordToken" WHERE "userId" = qls_owner_id AND "usedAt" IS NULL;
    INSERT INTO "PasswordToken" (id, "userId", "tokenHash", type, "expiresAt", "usedAt", "createdAt")
    VALUES (
      'fd0f87a9-fe8b-4140-9371-5e4bfe9a977d',
      qls_owner_id,
      '16f62c89f660ad9828914270f645d38977beb5ee6229cf727d01164a9b656a4b',
      'INVITE'::"PasswordTokenType",
      NOW() + INTERVAL '72 hours',
      NULL,
      NOW()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "AuditLog"
    WHERE action = 'PLATFORM_CUSTOMER_CREATED'
      AND "entityType" = 'BusinessPortal'
      AND "entityId" = qls_business_id
      AND details->>'source' = 'Stage 8 genuine onboarding'
  ) THEN
    INSERT INTO "AuditLog" (
      id, "actorId", "actorEmail", action, "entityType", "entityId", details, "createdAt"
    ) VALUES (
      'ac33ef9d-92e9-40e3-80b6-056163c34782',
      NULL,
      NULL,
      'PLATFORM_CUSTOMER_CREATED',
      'BusinessPortal',
      qls_business_id,
      jsonb_build_object(
        'businessName', 'Quality Landscape Solutions Pty Ltd',
        'portalName', 'Quality Landscape Solutions / QLS',
        'plan', 'STANDARD',
        'monthlyPrice', '50',
        'setupFee', '0',
        'gracePeriodDays', 7,
        'cancellation', 'Cancel anytime',
        'ownerEmail', 'lachlan.jepsen@outlook.com',
        'ownerPhone', '0420671816',
        'source', 'Stage 8 genuine onboarding'
      ),
      NOW()
    );
  END IF;
END $$;
