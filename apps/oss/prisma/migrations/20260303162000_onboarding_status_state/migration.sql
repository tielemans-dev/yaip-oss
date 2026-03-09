ALTER TABLE "org_settings"
  ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS "onboardingMethod" TEXT;

UPDATE "org_settings"
SET "onboardingStatus" = 'complete'
WHERE "onboardingCompletedAt" IS NOT NULL;

UPDATE "org_settings"
SET "onboardingStatus" = 'in_progress'
WHERE "onboardingCompletedAt" IS NULL
  AND "onboardingProfile" IS NOT NULL
  AND ("onboardingStatus" IS NULL OR "onboardingStatus" = 'not_started');

CREATE INDEX IF NOT EXISTS "org_settings_onboardingStatus_idx"
  ON "org_settings" ("onboardingStatus");
