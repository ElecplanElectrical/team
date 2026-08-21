ALTER TABLE "StockItem" ADD COLUMN "barcode" TEXT;
CREATE UNIQUE INDEX "StockItem_barcode_key" ON "StockItem"("barcode");
