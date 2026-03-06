ALTER TABLE "public"."invoice"
ADD COLUMN "lastEmailAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastEmailAttemptOutcome" TEXT,
ADD COLUMN "lastEmailAttemptCode" TEXT,
ADD COLUMN "lastEmailAttemptMessage" TEXT;

ALTER TABLE "public"."quote"
ADD COLUMN "lastEmailAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastEmailAttemptOutcome" TEXT,
ADD COLUMN "lastEmailAttemptCode" TEXT,
ADD COLUMN "lastEmailAttemptMessage" TEXT;
