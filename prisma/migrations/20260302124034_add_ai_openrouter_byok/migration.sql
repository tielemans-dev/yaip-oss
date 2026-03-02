-- AlterTable
ALTER TABLE "org_settings" ADD COLUMN     "aiOpenRouterApiKeyEnc" TEXT,
ADD COLUMN     "aiOpenRouterModel" TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini';
