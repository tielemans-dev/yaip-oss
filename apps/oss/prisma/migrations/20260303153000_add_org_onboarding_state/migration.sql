ALTER TABLE "org_settings"
  ADD COLUMN IF NOT EXISTS "onboardingProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "onboardingVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "org_settings_onboardingCompletedAt_idx"
  ON "org_settings" ("onboardingCompletedAt");
