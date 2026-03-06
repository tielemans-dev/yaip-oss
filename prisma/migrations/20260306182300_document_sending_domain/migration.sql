ALTER TABLE "public"."org_settings"
ADD COLUMN "documentSendingDomain" TEXT,
ADD COLUMN "documentSendingDomainProviderId" TEXT,
ADD COLUMN "documentSendingDomainStatus" TEXT,
ADD COLUMN "documentSendingDomainRecords" JSONB,
ADD COLUMN "documentSendingDomainFailureReason" TEXT,
ADD COLUMN "documentSendingDomainVerifiedAt" TIMESTAMP(3);
