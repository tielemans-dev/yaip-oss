import {
  type OnboardingAiSuggestion,
  type OnboardingPatch,
  getRequirementRules,
  listFollowupQuestions,
} from "./ai-contract"
import type { OnboardingMissingField } from "./readiness"

type HeuristicInput = {
  userMessage: string
  currentValues: Partial<OnboardingPatch>
  missing: readonly OnboardingMissingField[]
}

function maybeExtractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0] : undefined
}

function normalizeTaxRegime(text: string): OnboardingPatch["taxRegime"] | undefined {
  const lower = text.toLowerCase()
  if (lower.includes("vat") || lower.includes("moms")) return "eu_vat"
  if (lower.includes("sales tax")) return "us_sales_tax"
  if (lower.includes("custom")) return "custom"
  return undefined
}

function normalizeCountryCode(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (/\bdenmark\b|\bdanish\b|\bdk\b/.test(lower)) return "DK"
  if (/\bunited states\b|\busa\b|\bus\b/.test(lower)) return "US"
  if (/\bgermany\b|\bde\b/.test(lower)) return "DE"
  if (/\bfrance\b|\bfr\b/.test(lower)) return "FR"
  if (/\bnetherlands\b|\bnl\b/.test(lower)) return "NL"
  return undefined
}

function normalizeCurrency(text: string): string | undefined {
  const upper = text.toUpperCase()
  if (upper.includes("DKK")) return "DKK"
  if (upper.includes("USD")) return "USD"
  if (upper.includes("EUR")) return "EUR"
  if (upper.includes("GBP")) return "GBP"
  return undefined
}

function applyCountryDefaults(
  patch: OnboardingPatch,
  countryCode: string | undefined
) {
  if (!countryCode) return
  if (!patch.countryCode) patch.countryCode = countryCode

  if (countryCode === "DK") {
    patch.locale ??= "da-DK"
    patch.defaultCurrency ??= "DKK"
    patch.timezone ??= "Europe/Copenhagen"
  } else if (countryCode === "US") {
    patch.locale ??= "en-US"
    patch.defaultCurrency ??= "USD"
    patch.timezone ??= "America/New_York"
  } else if (countryCode === "DE") {
    patch.locale ??= "de-DE"
    patch.defaultCurrency ??= "EUR"
    patch.timezone ??= "Europe/Berlin"
  } else if (countryCode === "FR") {
    patch.locale ??= "fr-FR"
    patch.defaultCurrency ??= "EUR"
    patch.timezone ??= "Europe/Paris"
  } else if (countryCode === "NL") {
    patch.locale ??= "nl-NL"
    patch.defaultCurrency ??= "EUR"
    patch.timezone ??= "Europe/Amsterdam"
  }
}

export function suggestOnboardingPatchHeuristically(
  input: HeuristicInput
): OnboardingAiSuggestion {
  const patch: OnboardingPatch = {}
  const lower = input.userMessage.toLowerCase()

  const email = maybeExtractEmail(input.userMessage)
  if (email) patch.companyEmail = email

  const countryCode = normalizeCountryCode(input.userMessage)
  applyCountryDefaults(patch, countryCode)

  const taxRegime = normalizeTaxRegime(input.userMessage)
  if (taxRegime) patch.taxRegime = taxRegime

  const currency = normalizeCurrency(input.userMessage)
  if (currency) patch.defaultCurrency = currency

  if (/invoice prefix\s+([a-z0-9-]+)/i.test(input.userMessage)) {
    const match = input.userMessage.match(/invoice prefix\s+([a-z0-9-]+)/i)
    if (match?.[1]) patch.invoicePrefix = match[1].toUpperCase()
  }

  if (/quote prefix\s+([a-z0-9-]+)/i.test(input.userMessage)) {
    const match = input.userMessage.match(/quote prefix\s+([a-z0-9-]+)/i)
    if (match?.[1]) patch.quotePrefix = match[1].toUpperCase()
  }

  if (lower.includes("include tax") || lower.includes("prices include tax")) {
    patch.pricesIncludeTax = true
  }

  if (lower.includes("vat") && !patch.primaryTaxId && input.currentValues.primaryTaxId) {
    patch.primaryTaxId = input.currentValues.primaryTaxId
  }

  const requiredRules = getRequirementRules({
    countryCode: patch.countryCode ?? input.currentValues.countryCode ?? null,
    taxRegime: patch.taxRegime ?? input.currentValues.taxRegime ?? null,
  })

  const unresolvedRequired = requiredRules.requiredFields.filter((field) =>
    input.missing.includes(field)
  )

  const followupQuestions = listFollowupQuestions(unresolvedRequired)
    .slice(0, 3)
    .map((item) => item.question)

  return {
    patch,
    rationale:
      "Generated a structured onboarding patch from the provided message using deterministic cloud fallback logic.",
    confidence: Object.keys(patch).length > 0 ? 0.62 : 0.22,
    followupQuestions,
  }
}
