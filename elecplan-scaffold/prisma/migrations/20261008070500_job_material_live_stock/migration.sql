ALTER TABLE "JobMaterial" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "JobMaterial" ADD COLUMN IF NOT EXISTS "unitSell" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "JobMaterial" ADD COLUMN IF NOT EXISTS "stockQuantityApplied" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "JobMaterial" jm
SET "unitCost" = COALESCE(m."unitCost", 0)
FROM "Material" m
WHERE jm."materialId" = m."id"
  AND COALESCE(jm."unitCost", 0) = 0;
