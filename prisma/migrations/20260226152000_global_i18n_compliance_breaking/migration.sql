-- Global internationalization + compliance breaking migration.
-- This migration intentionally transforms legacy amount fields into
-- net/tax/gross structures while preserving existing invoice and quote data.

-- Org settings defaults for localization/compliance.
ALTER TABLE "org_settings"
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN "taxRegime" TEXT NOT NULL DEFAULT 'us_sales_tax',
  ADD COLUMN "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT false;

UPDATE "org_settings"
SET "defaultCurrency" = COALESCE(NULLIF("currency", ''), 'USD')
WHERE "defaultCurrency" = 'USD' AND COALESCE("currency", '') <> '';

-- Structured org tax IDs.
CREATE TABLE "organization_tax_id" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scheme" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "countryCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_tax_id_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organization_tax_id_organizationId_idx"
  ON "organization_tax_id"("organizationId");
CREATE INDEX "organization_tax_id_organizationId_scheme_idx"
  ON "organization_tax_id"("organizationId", "scheme");

ALTER TABLE "organization_tax_id"
  ADD CONSTRAINT "organization_tax_id_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "organization"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Structured contact tax IDs.
CREATE TABLE "contact_tax_id" (
  "id" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "scheme" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "countryCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contact_tax_id_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_tax_id_contactId_idx"
  ON "contact_tax_id"("contactId");
CREATE INDEX "contact_tax_id_contactId_scheme_idx"
  ON "contact_tax_id"("contactId", "scheme");

ALTER TABLE "contact_tax_id"
  ADD CONSTRAINT "contact_tax_id_contactId_fkey"
  FOREIGN KEY ("contactId")
  REFERENCES "contact"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Promote legacy free-text contact.taxId into structured table.
INSERT INTO "contact_tax_id" (
  "id",
  "contactId",
  "scheme",
  "value",
  "countryCode",
  "isPrimary",
  "createdAt",
  "updatedAt"
)
SELECT
  md5('contact_tax_id_' || c."id"),
  c."id",
  'other',
  c."taxId",
  c."country",
  true,
  NOW(),
  NOW()
FROM "contact" c
WHERE c."taxId" IS NOT NULL
  AND btrim(c."taxId") <> '';

-- Invoice header reshape.
ALTER TABLE "invoice"
  RENAME COLUMN "subtotal" TO "subtotalNet";
ALTER TABLE "invoice"
  RENAME COLUMN "taxAmount" TO "totalTax";
ALTER TABLE "invoice"
  RENAME COLUMN "total" TO "totalGross";

ALTER TABLE "invoice"
  ADD COLUMN "supplyDate" TIMESTAMP(3),
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "taxRegime" TEXT NOT NULL DEFAULT 'us_sales_tax',
  ADD COLUMN "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sellerSnapshot" JSONB,
  ADD COLUMN "buyerSnapshot" JSONB,
  ADD COLUMN "complianceStatus" TEXT NOT NULL DEFAULT 'valid',
  ADD COLUMN "complianceErrors" JSONB,
  ADD COLUMN "legalText" JSONB,
  ADD COLUMN "paymentReference" TEXT,
  ADD COLUMN "purchaseOrderRef" TEXT,
  ADD COLUMN "einvoiceFormat" TEXT,
  ADD COLUMN "einvoiceStatus" TEXT,
  ADD COLUMN "einvoiceExternalId" TEXT;

-- Backfill invoice locale/compliance metadata from org settings.
UPDATE "invoice" i
SET
  "countryCode" = os."countryCode",
  "locale" = os."locale",
  "timezone" = os."timezone",
  "taxRegime" = os."taxRegime",
  "pricesIncludeTax" = os."pricesIncludeTax"
FROM "org_settings" os
WHERE os."organizationId" = i."organizationId";

-- Invoice line reshape.
ALTER TABLE "invoice_item"
  RENAME COLUMN "total" TO "lineNet";
ALTER TABLE "invoice_item"
  RENAME COLUMN "unitPrice" TO "unitPriceNet";

ALTER TABLE "invoice_item"
  ADD COLUMN "unitPriceGross" DECIMAL(12,2),
  ADD COLUMN "lineTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "lineGross" DECIMAL(12,2),
  ADD COLUMN "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxCategory" TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN "taxCode" TEXT;

UPDATE "invoice_item"
SET
  "unitPriceGross" = "unitPriceNet",
  "lineTax" = 0,
  "lineGross" = "lineNet",
  "taxRate" = 0;

ALTER TABLE "invoice_item"
  ALTER COLUMN "unitPriceGross" SET NOT NULL,
  ALTER COLUMN "lineGross" SET NOT NULL;

-- Quote header reshape.
ALTER TABLE "quote"
  RENAME COLUMN "subtotal" TO "subtotalNet";
ALTER TABLE "quote"
  RENAME COLUMN "taxAmount" TO "totalTax";
ALTER TABLE "quote"
  RENAME COLUMN "total" TO "totalGross";

ALTER TABLE "quote"
  ADD COLUMN "supplyDate" TIMESTAMP(3),
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "taxRegime" TEXT NOT NULL DEFAULT 'us_sales_tax',
  ADD COLUMN "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sellerSnapshot" JSONB,
  ADD COLUMN "buyerSnapshot" JSONB,
  ADD COLUMN "complianceStatus" TEXT NOT NULL DEFAULT 'valid',
  ADD COLUMN "complianceErrors" JSONB,
  ADD COLUMN "legalText" JSONB,
  ADD COLUMN "purchaseOrderRef" TEXT,
  ADD COLUMN "paymentReference" TEXT;

UPDATE "quote" q
SET
  "countryCode" = os."countryCode",
  "locale" = os."locale",
  "timezone" = os."timezone",
  "taxRegime" = os."taxRegime",
  "pricesIncludeTax" = os."pricesIncludeTax"
FROM "org_settings" os
WHERE os."organizationId" = q."organizationId";

-- Quote line reshape.
ALTER TABLE "quote_item"
  RENAME COLUMN "total" TO "lineNet";
ALTER TABLE "quote_item"
  RENAME COLUMN "unitPrice" TO "unitPriceNet";

ALTER TABLE "quote_item"
  ADD COLUMN "unitPriceGross" DECIMAL(12,2),
  ADD COLUMN "lineTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "lineGross" DECIMAL(12,2),
  ADD COLUMN "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxCategory" TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN "taxCode" TEXT;

UPDATE "quote_item"
SET
  "unitPriceGross" = "unitPriceNet",
  "lineTax" = 0,
  "lineGross" = "lineNet",
  "taxRate" = 0;

ALTER TABLE "quote_item"
  ALTER COLUMN "unitPriceGross" SET NOT NULL,
  ALTER COLUMN "lineGross" SET NOT NULL;
