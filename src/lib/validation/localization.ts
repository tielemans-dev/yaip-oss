import { COUNTRY_OPTIONS } from "../compliance/countries"

const KNOWN_COUNTRIES = new Set(COUNTRY_OPTIONS.map((country) => country.code))

const PHONE_PATTERNS: Record<string, RegExp> = {
  DK: /^(\+45\s?)?\d{8}$/,
  US: /^(\+1[\s-]?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/,
  DE: /^(\+49[\s-]?)?(0)?[1-9]\d{6,13}$/,
  FR: /^(\+33[\s-]?)?(0)?[1-9](?:[\s.-]?\d{2}){4}$/,
  NL: /^(\+31[\s-]?)?(0)?[1-9]\d{8}$/,
}

const POSTAL_PATTERNS: Record<string, RegExp> = {
  DK: /^\d{4}$/,
  US: /^\d{5}(?:-\d{4})?$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  NL: /^\d{4}\s?[A-Z]{2}$/i,
}

const TAX_ID_PATTERNS: Record<string, RegExp[]> = {
  DK: [/^\d{8}$/, /^DK\d{8}$/i],
  US: [/^\d{2}-\d{7}$/],
  DE: [/^DE\d{9}$/i, /^\d{9}$/],
  FR: [/^FR[A-Z0-9]{2}\d{9}$/i],
  NL: [/^NL\d{9}B\d{2}$/i],
}

function stripSpaces(value: string) {
  return value.replace(/\s+/g, "")
}

export function getCountryCodeOrFallback(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toUpperCase()
  if (KNOWN_COUNTRIES.has(normalized)) return normalized
  return "US"
}

export function isValidPhoneForCountry(countryCode: string, phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return true
  const pattern = PHONE_PATTERNS[getCountryCodeOrFallback(countryCode)]
  if (pattern) return pattern.test(trimmed)
  return /^\+?[0-9()[\]\-.\s]{6,20}$/.test(trimmed)
}

export function isValidPostalCodeForCountry(countryCode: string, postalCode: string) {
  const trimmed = postalCode.trim()
  if (!trimmed) return true
  const pattern = POSTAL_PATTERNS[getCountryCodeOrFallback(countryCode)]
  if (pattern) return pattern.test(trimmed)
  return /^[A-Z0-9][A-Z0-9\s-]{2,12}$/i.test(trimmed)
}

export function isValidTaxIdForCountry(countryCode: string, taxId: string) {
  const trimmed = stripSpaces(taxId.trim())
  if (!trimmed) return true
  const patterns = TAX_ID_PATTERNS[getCountryCodeOrFallback(countryCode)]
  if (patterns) return patterns.some((pattern) => pattern.test(trimmed))
  return /^[A-Z0-9-]{4,20}$/i.test(trimmed)
}

export function validateLocalizedFields(
  countryCode: string,
  input: { phone?: string | null; postalCode?: string | null; taxId?: string | null }
) {
  const issues: { phone?: string; postalCode?: string; taxId?: string } = {}

  if (input.phone && !isValidPhoneForCountry(countryCode, input.phone)) {
    issues.phone = "Phone number format does not match selected country."
  }

  if (input.postalCode && !isValidPostalCodeForCountry(countryCode, input.postalCode)) {
    issues.postalCode = "Postal code format does not match selected country."
  }

  if (input.taxId && !isValidTaxIdForCountry(countryCode, input.taxId)) {
    issues.taxId = "Tax ID format does not match selected country."
  }

  return issues
}

