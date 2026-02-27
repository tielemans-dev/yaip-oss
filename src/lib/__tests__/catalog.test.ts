import { describe, expect, it } from "vitest"
import { applyCatalogItemToLineItem } from "../catalog"

describe("catalog line-item helpers", () => {
  it("autofills description and unit price while preserving quantity", () => {
    const lineItem = {
      description: "",
      quantity: 3,
      unitPrice: 0,
      catalogItemId: undefined as string | undefined,
    }

    const catalogItems = [
      {
        id: "item-1",
        name: "Consulting",
        description: "Hourly consulting",
        defaultUnitPrice: 150,
      },
    ]

    const updated = applyCatalogItemToLineItem(lineItem, "item-1", catalogItems)

    expect(updated).toMatchObject({
      description: "Hourly consulting",
      quantity: 3,
      unitPrice: 150,
      catalogItemId: "item-1",
    })
  })
})
