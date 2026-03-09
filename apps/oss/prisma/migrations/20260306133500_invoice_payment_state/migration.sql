-- AlterTable
ALTER TABLE "public"."invoice"
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "invoice_organization_id_payment_status_idx"
ON "public"."invoice"("organizationId", "paymentStatus");
