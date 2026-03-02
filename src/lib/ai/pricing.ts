export function resolveDraftItemUnitPrice(input: {
  requestedUnitPrice?: number
  resolvedCatalogItemId?: string
  catalogDefaultsById: Map<string, number>
}) {
  if (typeof input.requestedUnitPrice === "number") {
    return input.requestedUnitPrice
  }

  if (input.resolvedCatalogItemId) {
    const catalogDefault = input.catalogDefaultsById.get(input.resolvedCatalogItemId)
    if (typeof catalogDefault === "number") {
      return catalogDefault
    }
  }

  return 0
}
