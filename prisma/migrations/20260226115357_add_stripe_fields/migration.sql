-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'free';

-- CreateIndex
CREATE UNIQUE INDEX "organization_stripeCustomerId_key" ON "organization"("stripeCustomerId");
