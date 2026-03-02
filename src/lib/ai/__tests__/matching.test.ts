import { describe, expect, it } from "vitest"
import { resolveCatalogItemId, resolveContactId } from "../matching"

describe("ai matching helpers", () => {
  it("resolves contact by exact id or name", () => {
    const contacts = [
      { id: "c1", name: "Emil Hansen" },
      { id: "c2", name: "Acme ApS" },
    ]

    expect(
      resolveContactId({
        requestedContactId: "c1",
        contacts,
      })
    ).toBe("c1")

    expect(
      resolveContactId({
        requestedContactName: "emil",
        contacts,
      })
    ).toBe("c1")
  })

  it("resolves catalog item from provided id or description", () => {
    const catalogItems = [
      { id: "i1", name: "1 gangs fræsning", description: "Fræsning på adresse" },
      { id: "i2", name: "Design time", description: null },
    ]

    expect(
      resolveCatalogItemId({
        requestedCatalogItemId: "i1",
        catalogItems,
      })
    ).toBe("i1")

    expect(
      resolveCatalogItemId({
        description: "fræsning",
        catalogItems,
      })
    ).toBe("i1")
  })
})
