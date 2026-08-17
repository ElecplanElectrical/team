-- Add durable quote and invoice references plus GST breakdowns.
ALTER TABLE "Quote" ADD COLUMN "quoteNumber" TEXT;
ALTER TABLE "Quote" ADD COLUMN "subtotal" DECIMAL(65,30);
ALTER TABLE "Quote" ADD COLUMN "gstAmount" DECIMAL(65,30);

ALTER TABLE "Invoice" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "subtotal" DECIMAL(65,30);
ALTER TABLE "Invoice" ADD COLUMN "gstAmount" DECIMAL(65,30);
ALTER TABLE "Invoice" ADD COLUMN "sourceQuoteId" TEXT;

CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_sourceQuoteId_key" ON "Invoice"("sourceQuoteId");

CREATE TABLE "QuoteLineItem" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL,
  "lineTotal" DECIMAL(65,30) NOT NULL,
  "gstRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
  CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InvoiceLineItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL,
  "lineTotal" DECIMAL(65,30) NOT NULL,
  "gstRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
  CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
