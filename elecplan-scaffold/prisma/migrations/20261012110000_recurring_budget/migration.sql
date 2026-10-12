CREATE TABLE "RecurringExpense" (
"id" TEXT NOT NULL,"name" TEXT NOT NULL,"category" TEXT NOT NULL DEFAULT 'Other',"amount" DECIMAL(12,2) NOT NULL,"frequency" TEXT NOT NULL DEFAULT 'MONTHLY',"nextDue" DATE NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id"));
CREATE INDEX "RecurringExpense_active_nextDue_idx" ON "RecurringExpense"("active","nextDue");
CREATE TABLE "RecurringExpensePayment" ("id" TEXT NOT NULL,"expenseId" TEXT NOT NULL,"dueDate" DATE NOT NULL,"amount" DECIMAL(12,2) NOT NULL,"paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "RecurringExpensePayment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "RecurringExpensePayment_expenseId_dueDate_key" ON "RecurringExpensePayment"("expenseId","dueDate");
ALTER TABLE "RecurringExpensePayment" ADD CONSTRAINT "RecurringExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "RecurringExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;