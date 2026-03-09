import { describe, expect, it } from "vitest"
import { resolveDraftItemDescription } from "../description"

describe("ai draft description resolver", () => {
  const catalogItemsById = new Map([
    ["c1", { name: "1 gangs fræsning", description: null }],
    ["c2", { name: "Design timer", description: "Konsulenttimer for design" }],
  ])

  it("omits description when it duplicates catalog item name", () => {
    expect(
      resolveDraftItemDescription({
        requestedDescription: "1 gangs fræsning",
        resolvedCatalogItemId: "c1",
        catalogItemsById,
      })
    ).toBeUndefined()
  })

  it("keeps description when it adds detail beyond catalog name", () => {
    expect(
      resolveDraftItemDescription({
        requestedDescription: "1 gangs fræsning i baghave med oprydning",
        resolvedCatalogItemId: "c1",
        catalogItemsById,
      })
    ).toBe("1 gangs fræsning i baghave med oprydning")
  })

  it("returns undefined for empty descriptions", () => {
    expect(
      resolveDraftItemDescription({
        requestedDescription: "   ",
        resolvedCatalogItemId: "c2",
        catalogItemsById,
      })
    ).toBeUndefined()
  })
})
