function normalizeText(value: string | undefined | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
}

export function resolveDraftItemDescription(input: {
  requestedDescription?: string
  resolvedCatalogItemId?: string
  catalogItemsById: Map<string, { name: string; description?: string | null }>
}) {
  const description = input.requestedDescription?.trim()
  if (!description) return undefined

  if (!input.resolvedCatalogItemId) return description

  const catalogItem = input.catalogItemsById.get(input.resolvedCatalogItemId)
  if (!catalogItem) return description

  const normalizedDescription = normalizeText(description)
  const normalizedCatalogName = normalizeText(catalogItem.name)

  if (!normalizedDescription) return undefined
  if (normalizedDescription === normalizedCatalogName) return undefined
  if (normalizedCatalogName.includes(normalizedDescription)) return undefined

  return description
}
