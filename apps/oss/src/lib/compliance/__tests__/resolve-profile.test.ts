import { describe, expect, it } from "vitest"
import { resolveCountryProfile } from "../resolve-profile"

describe("resolveCountryProfile", () => {
  it("resolves US profile directly", () => {
    const profile = resolveCountryProfile("US")
    expect(profile.countryCode).toBe("US")
  })

  it("resolves DK profile directly", () => {
    const profile = resolveCountryProfile("DK")
    expect(profile.countryCode).toBe("DK")
  })

  it("resolves EU baseline for EU countries without dedicated profile", () => {
    const profile = resolveCountryProfile("DE")
    expect(profile.countryCode).toBe("EU")
  })

  it("falls back to US for unknown countries", () => {
    const profile = resolveCountryProfile("ZZ")
    expect(profile.countryCode).toBe("US")
  })
})
