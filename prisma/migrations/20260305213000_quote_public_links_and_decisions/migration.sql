ALTER TABLE "quote"
  ADD COLUMN IF NOT EXISTS "publicAccessKeyVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "publicAccessIssuedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publicDecisionAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publicRejectionReason" TEXT;

CREATE INDEX IF NOT EXISTS "quote_organizationId_publicDecisionAt_idx"
  ON "quote" ("organizationId", "publicDecisionAt");
