-- AlterTable
ALTER TABLE "public"."org_settings"
ADD COLUMN "stripePublishableKey" TEXT,
ADD COLUMN "stripeSecretKeyEnc" TEXT,
ADD COLUMN "stripeWebhookSecretEnc" TEXT;
