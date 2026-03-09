import { describe, expect, it } from "vitest"
import {
  getCountryCodeOrFallback,
  isValidPhoneForCountry,
  isValidPostalCodeForCountry,
  isValidTaxIdForCountry,
  validateLocalizedFields,
} from "../localization"

describe("localization validators", () => {
  it("resolves country code fallback to US", () => {
    expect(getCountryCodeOrFallback("dk")).toBe("DK")
    expect(getCountryCodeOrFallback(undefined)).toBe("US")
    expect(getCountryCodeOrFallback("")).toBe("US")
  })

  it("validates phone numbers by country", () => {
    expect(isValidPhoneForCountry("DK", "+45 40146639")).toBe(true)
    expect(isValidPhoneForCountry("US", "(312) 555-0199")).toBe(true)
    expect(isValidPhoneForCountry("DK", "123")).toBe(false)
  })

  it("validates postal codes by country", () => {
    expect(isValidPostalCodeForCountry("DK", "9220")).toBe(true)
    expect(isValidPostalCodeForCountry("US", "30301")).toBe(true)
    expect(isValidPostalCodeForCountry("US", "9220")).toBe(false)
  })

  it("validates tax ids by country", () => {
    expect(isValidTaxIdForCountry("US", "12-3456789")).toBe(true)
    expect(isValidTaxIdForCountry("DK", "12345678")).toBe(true)
    expect(isValidTaxIdForCountry("DK", "DK12345678")).toBe(true)
    expect(isValidTaxIdForCountry("US", "12345678")).toBe(false)
  })

  it("returns field-level errors for invalid localized data", () => {
    const result = validateLocalizedFields("DK", {
      phone: "123",
      postalCode: "ABCDE",
      taxId: "12-3456789",
    })

    expect(result.phone).toMatch(/phone/i)
    expect(result.postalCode).toMatch(/postal/i)
    expect(result.taxId).toMatch(/tax id/i)
  })
})

