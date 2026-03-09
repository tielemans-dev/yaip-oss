import type {
  OnboardingMissingField,
  OnboardingTaxRegime,
} from "@yaip/contracts/onboarding"

export type SupportedTaxRegime = OnboardingTaxRegime
export type { OnboardingMissingField }

export type OnboardingReadinessInput = {
  countryCode: string | null
  locale: string | null
  timezone: string | null
  defaultCurrency: string | null
  taxRegime: string | null
  pricesIncludeTax: boolean | null
  companyName: string | null
  companyAddress: string | null
  companyEmail: string | null
  invoicePrefix: string | null
  invoiceNextNum: number | null
  quotePrefix: string | null
  quoteNextNum: number | null
  primaryTaxId: string | null
}

export type OnboardingReadinessResult = {
  isComplete: boolean
  missing: OnboardingMissingField[]
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasPositiveInteger(value: number | null | undefined) {
  return Number.isInteger(value) && (value ?? 0) > 0
}

function shouldRequirePrimaryTaxId(input: OnboardingReadinessInput) {
  return input.taxRegime === "eu_vat"
}

export function evaluateOnboardingReadiness(
  input: OnboardingReadinessInput
): OnboardingReadinessResult {
  const missing: OnboardingMissingField[] = []

  if (!hasText(input.companyName)) missing.push("companyName")
  if (!hasText(input.companyAddress)) missing.push("companyAddress")
  if (!hasText(input.companyEmail)) missing.push("companyEmail")
  if (!hasText(input.countryCode)) missing.push("countryCode")
  if (!hasText(input.locale)) missing.push("locale")
  if (!hasText(input.timezone)) missing.push("timezone")
  if (!hasText(input.defaultCurrency)) missing.push("defaultCurrency")
  if (!hasText(input.taxRegime)) missing.push("taxRegime")
  if (!hasText(input.invoicePrefix)) missing.push("invoicePrefix")
  if (!hasPositiveInteger(input.invoiceNextNum)) missing.push("invoiceNextNum")
  if (!hasText(input.quotePrefix)) missing.push("quotePrefix")
  if (!hasPositiveInteger(input.quoteNextNum)) missing.push("quoteNextNum")

  if (shouldRequirePrimaryTaxId(input) && !hasText(input.primaryTaxId)) {
    missing.push("primaryTaxId")
  }

  return {
    isComplete: missing.length === 0,
    missing,
  }
}
