ALTER TABLE "public"."org_settings"
ADD COLUMN "documentSendingLastSyncedAt" TIMESTAMP(3),
ADD COLUMN "documentSendingLastSyncSource" TEXT;
