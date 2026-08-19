CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assetNumber" TEXT,
    "serialNumber" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT NOT NULL DEFAULT 'Workshop',
    "assignedUserId" TEXT,
    "assignedJobId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "lastStocktakeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EquipmentMovement" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "assignedUserId" TEXT,
    "assignedJobId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentMovement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Equipment_assetNumber_key" ON "Equipment"("assetNumber");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
CREATE INDEX "Equipment_assignedUserId_idx" ON "Equipment"("assignedUserId");
CREATE INDEX "Equipment_assignedJobId_idx" ON "Equipment"("assignedJobId");
CREATE INDEX "EquipmentMovement_equipmentId_createdAt_idx" ON "EquipmentMovement"("equipmentId", "createdAt");
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
