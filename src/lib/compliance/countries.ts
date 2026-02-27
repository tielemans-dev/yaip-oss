export type CountryOption = {
  code: string
  label: string
  defaultLocale: string
  defaultCurrency: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: "US",
    label: "United States",
    defaultLocale: "en-US",
    defaultCurrency: "USD",
  },
  {
    code: "DK",
    label: "Denmark",
    defaultLocale: "da-DK",
    defaultCurrency: "DKK",
  },
  {
    code: "DE",
    label: "Germany",
    defaultLocale: "de-DE",
    defaultCurrency: "EUR",
  },
  {
    code: "FR",
    label: "France",
    defaultLocale: "fr-FR",
    defaultCurrency: "EUR",
  },
  {
    code: "NL",
    label: "Netherlands",
    defaultLocale: "nl-NL",
    defaultCurrency: "EUR",
  },
]

export const LOCALE_OPTIONS = [
  "en-US",
  "da-DK",
  "de-DE",
  "fr-FR",
  "nl-NL",
  "en-GB",
  "es-ES",
]

export const TAX_REGIMES = [
  { value: "us_sales_tax", label: "US Sales Tax" },
  { value: "eu_vat", label: "EU VAT" },
  { value: "custom", label: "Custom" },
] as const
