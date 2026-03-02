import { describe, expect, it } from "vitest"
import { resolveDraftItemUnitPrice } from "../pricing"

describe("ai invoice draft pricing", () => {
  it("uses catalog default price when unitPrice is omitted and catalog item is matched", () => {
    expect(
      resolveDraftItemUnitPrice({
        requestedUnitPrice: undefined,
        resolvedCatalogItemId: "item-1",
        catalogDefaultsById: new Map([["item-1", 750]]),
      })
    ).toBe(750)
  })

  it("uses model-provided unitPrice when present", () => {
    expect(
      resolveDraftItemUnitPrice({
        requestedUnitPrice: 1200,
        resolvedCatalogItemId: "item-1",
        catalogDefaultsById: new Map([["item-1", 750]]),
      })
    ).toBe(1200)
  })

  it("falls back to zero for unmatched items without a price", () => {
    expect(
      resolveDraftItemUnitPrice({
        requestedUnitPrice: undefined,
        resolvedCatalogItemId: undefined,
        catalogDefaultsById: new Map([["item-1", 750]]),
      })
    ).toBe(0)
  })
})
