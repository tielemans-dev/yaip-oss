export type CatalogItemOption = {
  id: string
  name: string
  description: string | null
  defaultUnitPrice: number
}

export type CatalogLineItem = {
  description: string
  quantity: number
  unitPrice: number
  catalogItemId?: string
}

export function applyCatalogItemToLineItem(
  lineItem: CatalogLineItem,
  catalogItemId: string,
  catalogItems: CatalogItemOption[]
): CatalogLineItem {
  const selected = catalogItems.find((item) => item.id === catalogItemId)
  if (!selected) return lineItem

  return {
    ...lineItem,
    catalogItemId,
    description: selected.description?.trim() || selected.name,
    unitPrice: selected.defaultUnitPrice,
  }
}
