-- Seed an isolated YourPlan sales-demo tenant with fictional data only.
-- The demo account is intentionally marked as a demo session in auth and
-- mutation requests are blocked at middleware level.

INSERT INTO "BusinessPortal" (
  "id", "name", "slug", "industry", "contactName", "contactEmail", "logoUrl",
  "primaryColor", "accentColor", "modules", "plan", "monthlyPrice", "active", "createdAt", "updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000100',
  'YourPlan Demo Business',
  'demo',
  'Service & Trade Business',
  'Demo Manager',
  'demo@your-plan.com.au',
  NULL,
  '#168dff',
  '#25c7ff',
  '["dashboard","jobs","calendar","clients","leads","quotes","invoices","employees","timesheets","inspections","documents","materials","reminders","analytics"]'::jsonb,
  'DEMO',
  0,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "industry" = EXCLUDED."industry",
  "contactName" = EXCLUDED."contactName",
  "contactEmail" = EXCLUDED."contactEmail",
  "primaryColor" = EXCLUDED."primaryColor",
  "accentColor" = EXCLUDED."accentColor",
  "modules" = EXCLUDED."modules",
  "plan" = EXCLUDED."plan",
  "monthlyPrice" = EXCLUDED."monthlyPrice",
  "active" = TRUE,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "User" (
  "id", "name", "email", "role", "passwordHash", "active", "createdAt", "businessId"
) VALUES (
  '00000000-0000-4000-8000-000000000101',
  'Demo Manager',
  'demo@your-plan.com.au',
  'ADMIN',
  '$2b$12$qjBtdQnt/HtL7UgPyWzyjOF34TkqfWZK6OB3jl5jfB5E7maZlhUNW',
  TRUE,
  CURRENT_TIMESTAMP,
  '00000000-0000-4000-8000-000000000100'
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = 'ADMIN',
  "passwordHash" = EXCLUDED."passwordHash",
  "active" = TRUE,
  "businessId" = '00000000-0000-4000-8000-000000000100';

INSERT INTO "User" ("id", "name", "email", "role", "active", "createdAt", "businessId") VALUES
('00000000-0000-4000-8000-000000000102','Alex Taylor','alex.taylor.demo@your-plan.com.au','SUPERVISOR',TRUE,CURRENT_TIMESTAMP,'00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000103','Jordan Lee','jordan.lee.demo@your-plan.com.au','EMPLOYEE',TRUE,CURRENT_TIMESTAMP,'00000000-0000-4000-8000-000000000100')
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Client" ("id","name","contactName","phone","email","address","createdAt","businessId") VALUES
('00000000-0000-4000-8000-000000000110','Northside Property Group','Sam Carter','0400 000 101','sam@example.invalid','12 Sample Street, Melbourne VIC',CURRENT_TIMESTAMP - INTERVAL '30 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000111','Riverside Residence','Casey Morgan','0400 000 102','casey@example.invalid','48 Example Avenue, Melbourne VIC',CURRENT_TIMESTAMP - INTERVAL '24 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000112','Oak & Co Offices','Taylor Smith','0400 000 103','taylor@example.invalid','85 Demo Road, Melbourne VIC',CURRENT_TIMESTAMP - INTERVAL '18 days','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Lead" ("id","clientId","description","stage","value","source","createdAt","businessId") VALUES
('00000000-0000-4000-8000-000000000120','00000000-0000-4000-8000-000000000110','Commercial maintenance program','NEW',12500,'Website',CURRENT_TIMESTAMP - INTERVAL '2 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000111','Front property renovation','QUOTED',8900,'Referral',CURRENT_TIMESTAMP - INTERVAL '5 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000122','00000000-0000-4000-8000-000000000112','Office upgrade works','WON',21400,'Existing client',CURRENT_TIMESTAMP - INTERVAL '9 days','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Job" ("id","title","clientId","address","status","assignedToId","scheduledStart","scheduledEnd","notes","createdAt","businessId") VALUES
('00000000-0000-4000-8000-000000000130','Office upgrade works','00000000-0000-4000-8000-000000000112','85 Demo Road, Melbourne VIC','IN_PROGRESS','00000000-0000-4000-8000-000000000102',CURRENT_TIMESTAMP + INTERVAL '1 hour',CURRENT_TIMESTAMP + INTERVAL '5 hours','Demo job showing active workflow.',CURRENT_TIMESTAMP - INTERVAL '8 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000131','Front property renovation','00000000-0000-4000-8000-000000000111','48 Example Avenue, Melbourne VIC','SCHEDULED','00000000-0000-4000-8000-000000000103',CURRENT_TIMESTAMP + INTERVAL '1 day',CURRENT_TIMESTAMP + INTERVAL '1 day 6 hours','Fictional demo data.',CURRENT_TIMESTAMP - INTERVAL '4 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000132','Maintenance inspection','00000000-0000-4000-8000-000000000110','12 Sample Street, Melbourne VIC','COMPLETE','00000000-0000-4000-8000-000000000102',CURRENT_TIMESTAMP - INTERVAL '2 days',CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '3 hours','Completed demo job.',CURRENT_TIMESTAMP - INTERVAL '12 days','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "JobEvent" ("id","jobId","title","notes","type","startsAt","endsAt","assignedToId") VALUES
('00000000-0000-4000-8000-000000000140','00000000-0000-4000-8000-000000000130','Office upgrade works','Active demo booking','JOB',CURRENT_TIMESTAMP + INTERVAL '1 hour',CURRENT_TIMESTAMP + INTERVAL '5 hours','00000000-0000-4000-8000-000000000102'),
('00000000-0000-4000-8000-000000000141','00000000-0000-4000-8000-000000000131','Front property renovation','Tomorrow demo booking','JOB',CURRENT_TIMESTAMP + INTERVAL '1 day',CURRENT_TIMESTAMP + INTERVAL '1 day 6 hours','00000000-0000-4000-8000-000000000103')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Quote" ("id","quoteNumber","jobId","clientId","subtotal","gstAmount","amount","status","createdAt","businessId") VALUES
('00000000-0000-4000-8000-000000000150','DEMO-Q-001','00000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000111',8090.91,809.09,8900,'SENT',CURRENT_TIMESTAMP - INTERVAL '4 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000151','DEMO-Q-002','00000000-0000-4000-8000-000000000130','00000000-0000-4000-8000-000000000112',19454.55,1945.45,21400,'ACCEPTED',CURRENT_TIMESTAMP - INTERVAL '8 days','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuoteLineItem" ("id","quoteId","description","quantity","unitPrice","lineTotal","gstRate") VALUES
('00000000-0000-4000-8000-000000000152','00000000-0000-4000-8000-000000000150','Project works package',1,8090.91,8090.91,0.10),
('00000000-0000-4000-8000-000000000153','00000000-0000-4000-8000-000000000151','Office upgrade package',1,19454.55,19454.55,0.10)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Invoice" ("id","invoiceNumber","jobId","clientId","subtotal","gstAmount","amount","dueDate","status","createdAt","businessId") VALUES
('00000000-0000-4000-8000-000000000160','DEMO-INV-001','00000000-0000-4000-8000-000000000132','00000000-0000-4000-8000-000000000110',3400,340,3740,CURRENT_TIMESTAMP + INTERVAL '7 days','UNPAID',CURRENT_TIMESTAMP - INTERVAL '2 days','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000161','DEMO-INV-002','00000000-0000-4000-8000-000000000130','00000000-0000-4000-8000-000000000112',6000,600,6600,CURRENT_TIMESTAMP - INTERVAL '1 day','OVERDUE',CURRENT_TIMESTAMP - INTERVAL '15 days','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "InvoiceLineItem" ("id","invoiceId","description","quantity","unitPrice","lineTotal","gstRate") VALUES
('00000000-0000-4000-8000-000000000162','00000000-0000-4000-8000-000000000160','Completed maintenance works',1,3400,3400,0.10),
('00000000-0000-4000-8000-000000000163','00000000-0000-4000-8000-000000000161','Progress claim',1,6000,6000,0.10)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "StockItem" ("id","name","unit","onHand","parLevel","supplier","businessId") VALUES
('00000000-0000-4000-8000-000000000170','General consumables','box',18,10,'Demo Supplier','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000171','Fixing kit','pack',7,5,'Demo Supplier','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000172','Site protection','roll',4,6,'Demo Supplier','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Timesheet" ("id","userId","date","hours","status","businessId") VALUES
('00000000-0000-4000-8000-000000000180','00000000-0000-4000-8000-000000000102',CURRENT_DATE,7.5,'APPROVED','00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000181','00000000-0000-4000-8000-000000000103',CURRENT_DATE,6.5,'PENDING','00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Reminder" ("id","userId","title","dueDate","tag","completed","businessId") VALUES
('00000000-0000-4000-8000-000000000190','00000000-0000-4000-8000-000000000101','Follow up open quote',CURRENT_TIMESTAMP + INTERVAL '4 hours','Sales',FALSE,'00000000-0000-4000-8000-000000000100'),
('00000000-0000-4000-8000-000000000191','00000000-0000-4000-8000-000000000101','Review overdue invoice',CURRENT_TIMESTAMP + INTERVAL '1 day','Accounts',FALSE,'00000000-0000-4000-8000-000000000100')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "BusinessSubscription" (
  "businessId","status","setupFee","gracePeriodDays","graceEndsAt","currentPeriodEnd","cancelAtPeriodEnd","cancelledAt","provider","providerCustomerId","providerSubscriptionId","createdAt","updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000100','ACTIVE',0,7,NULL,NULL,FALSE,NULL,'DEMO',NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT ("businessId") DO UPDATE SET "status"='ACTIVE', "updatedAt"=CURRENT_TIMESTAMP;
