-- AlterTable
ALTER TABLE "invoice_item" ALTER COLUMN "taxRate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "quote_item" ALTER COLUMN "taxRate" DROP DEFAULT;

-- CreateTable
CREATE TABLE "catalog_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultUnitPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_item_organizationId_idx" ON "catalog_item"("organizationId");

-- CreateIndex
CREATE INDEX "catalog_item_organizationId_isActive_idx" ON "catalog_item"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_item_organizationId_name_key" ON "catalog_item"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "catalog_item" ADD CONSTRAINT "catalog_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
