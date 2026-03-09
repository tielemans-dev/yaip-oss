import { describe, expect, it } from "vitest"
import { validateDocument } from "../validate"
import { resolveCountryProfile } from "../resolve-profile"

describe("validateDocument", () => {
  it("requires at least one seller tax id for Denmark", () => {
    const dk = resolveCountryProfile("DK")
    const result = validateDocument(dk, {
      sellerTaxIds: [],
      buyerTaxIds: [],
      taxRate: 25,
    })

    expect(result.some((item) => item.code === "MISSING_SELLER_TAX_ID")).toBe(true)
  })

  it("does not require seller tax id for US profile", () => {
    const us = resolveCountryProfile("US")
    const result = validateDocument(us, {
      sellerTaxIds: [],
      buyerTaxIds: [],
      taxRate: 8,
    })

    expect(result).toHaveLength(0)
  })
})
