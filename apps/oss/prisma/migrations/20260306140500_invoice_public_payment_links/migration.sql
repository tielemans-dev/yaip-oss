-- AlterTable
ALTER TABLE "public"."invoice"
ADD COLUMN "publicPaymentIssuedAt" TIMESTAMP(3),
ADD COLUMN "publicPaymentKeyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "paymentFailureReason" TEXT;

-- CreateIndex
CREATE INDEX "invoice_organizationId_publicPaymentIssuedAt_idx"
ON "public"."invoice"("organizationId", "publicPaymentIssuedAt");
