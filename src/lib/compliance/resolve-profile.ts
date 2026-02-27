import type { CountryProfile } from "./country-profile"
import { dkProfile } from "./profiles/dk"
import { euBaselineProfile } from "./profiles/eu-baseline"
import { usProfile } from "./profiles/us"

const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
])

export function resolveCountryProfile(countryCode?: string | null): CountryProfile {
  const code = countryCode?.trim().toUpperCase()

  if (code === "US") return usProfile
  if (code === "DK") return dkProfile
  if (code && EU_COUNTRIES.has(code)) return euBaselineProfile

  return usProfile
}
