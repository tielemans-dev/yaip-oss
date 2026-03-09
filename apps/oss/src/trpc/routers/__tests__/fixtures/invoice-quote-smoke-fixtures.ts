import type { InvoiceQuoteSmokeOptions } from "../invoice-quote-smoke"

export type SmokeScenario = {
  name: string
  options: Partial<InvoiceQuoteSmokeOptions>
  expectsComplianceBlock: boolean
  expectedTotals?: {
    quote: number
    convertedInvoice: number
    directInvoice: number
  }
}

export const DK_SCENARIO: SmokeScenario = {
  name: "dk-compliance",
  options: {
    countryCode: "DK",
    locale: "da-DK",
    timezone: "Europe/Copenhagen",
    currency: "DKK",
    taxRegime: "eu_vat",
    pricesIncludeTax: false,
  },
  expectsComplianceBlock: true,
  expectedTotals: {
    quote: 3240,
    convertedInvoice: 1952,
    directInvoice: 1100,
  },
}

export const US_SCENARIO: SmokeScenario = {
  name: "us-sales-tax",
  options: {
    countryCode: "US",
    locale: "en-US",
    timezone: "America/New_York",
    currency: "USD",
    taxRegime: "us_sales_tax",
    pricesIncludeTax: false,
  },
  expectsComplianceBlock: false,
}

export const EU_BASELINE_SCENARIO: SmokeScenario = {
  name: "eu-baseline",
  options: {
    countryCode: "DE",
    locale: "de-DE",
    timezone: "Europe/Berlin",
    currency: "EUR",
    taxRegime: "eu_vat",
    pricesIncludeTax: false,
  },
  expectsComplianceBlock: true,
}

export const PRICES_INCLUDE_TAX_SCENARIO: SmokeScenario = {
  name: "prices-include-tax",
  options: {
    countryCode: "DK",
    locale: "da-DK",
    timezone: "Europe/Copenhagen",
    currency: "DKK",
    taxRegime: "eu_vat",
    pricesIncludeTax: true,
  },
  expectsComplianceBlock: true,
  expectedTotals: {
    quote: 2700,
    convertedInvoice: 1600,
    directInvoice: 1000,
  },
}
