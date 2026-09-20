DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";
CREATE INDEX IF NOT EXISTS "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
