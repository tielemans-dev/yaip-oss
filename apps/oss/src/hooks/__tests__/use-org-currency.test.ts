import { describe, expect, it } from "vitest"
import { resolveOrgCurrency } from "../use-org-currency"

describe("resolveOrgCurrency", () => {
  it("prefers defaultCurrency when present", () => {
    expect(
      resolveOrgCurrency({ defaultCurrency: " dkk ", currency: "USD" })
    ).toBe("DKK")
  })

  it("falls back to currency when defaultCurrency is missing", () => {
    expect(resolveOrgCurrency({ currency: "eur" })).toBe("EUR")
  })

  it("falls back to USD when settings have no currency", () => {
    expect(resolveOrgCurrency({})).toBe("USD")
    expect(resolveOrgCurrency()).toBe("USD")
  })
})
