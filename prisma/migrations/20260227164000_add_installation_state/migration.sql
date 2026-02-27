-- CreateTable
CREATE TABLE "installation_state" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "distribution" TEXT NOT NULL DEFAULT 'selfhost',
    "setupVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_state_pkey" PRIMARY KEY ("id")
);
