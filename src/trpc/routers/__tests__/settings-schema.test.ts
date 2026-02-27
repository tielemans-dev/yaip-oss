import { describe, expect, it } from "vitest"
import { settingsUpdateSchema } from "../settings"

describe("settingsUpdateSchema", () => {
  it("accepts global locale and compliance fields", () => {
    const parsed = settingsUpdateSchema.parse({
      countryCode: "DK",
      locale: "da-DK",
      timezone: "Europe/Copenhagen",
      defaultCurrency: "DKK",
      taxRegime: "eu_vat",
      pricesIncludeTax: true,
    })

    expect(parsed.countryCode).toBe("DK")
    expect(parsed.defaultCurrency).toBe("DKK")
    expect(parsed.pricesIncludeTax).toBe(true)
  })

  it("rejects unsupported tax regime", () => {
    expect(() =>
      settingsUpdateSchema.parse({
        taxRegime: "bad_regime",
      })
    ).toThrow()
  })

  it("accepts company logo as URL or uploaded image data", () => {
    const urlLogo = settingsUpdateSchema.parse({
      companyLogo: "https://cdn.example.com/logo.png",
    })
    const dataLogo = settingsUpdateSchema.parse({
      companyLogo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
    })

    expect(urlLogo.companyLogo).toBe("https://cdn.example.com/logo.png")
    expect(dataLogo.companyLogo?.startsWith("data:image/png;base64,")).toBe(true)
  })

  it("rejects invalid company logo value", () => {
    expect(() =>
      settingsUpdateSchema.parse({
        companyLogo: "not-a-logo",
      })
    ).toThrow()
  })

  it("rejects unsupported locale/timezone", () => {
    expect(() =>
      settingsUpdateSchema.parse({
        locale: "en-XX",
      })
    ).toThrow()

    expect(() =>
      settingsUpdateSchema.parse({
        timezone: "Mars/OlympusMons",
      })
    ).toThrow()
  })
})
