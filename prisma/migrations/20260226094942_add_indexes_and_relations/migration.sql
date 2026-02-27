/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,userId]` on the table `member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "contact_organizationId_idx" ON "contact"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_inviterId_idx" ON "invitation"("inviterId");

-- CreateIndex
CREATE INDEX "invoice_organizationId_idx" ON "invoice"("organizationId");

-- CreateIndex
CREATE INDEX "invoice_contactId_idx" ON "invoice"("contactId");

-- CreateIndex
CREATE INDEX "invoice_organizationId_status_idx" ON "invoice"("organizationId", "status");

-- CreateIndex
CREATE INDEX "invoice_item_invoiceId_idx" ON "invoice_item"("invoiceId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "quote_organizationId_idx" ON "quote"("organizationId");

-- CreateIndex
CREATE INDEX "quote_contactId_idx" ON "quote"("contactId");

-- CreateIndex
CREATE INDEX "quote_organizationId_status_idx" ON "quote"("organizationId", "status");

-- CreateIndex
CREATE INDEX "quote_item_quoteId_idx" ON "quote_item"("quoteId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
