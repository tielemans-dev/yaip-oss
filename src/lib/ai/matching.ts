function normalizeText(input: string | null | undefined) {
  return (input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
}

function findByName<T extends { id: string; name: string }>(
  value: string | undefined,
  list: T[]
) {
  const needle = normalizeText(value)
  if (!needle) return undefined

  const exact = list.find((item) => normalizeText(item.name) === needle)
  if (exact) return exact.id

  const contains = list.find((item) => {
    const candidate = normalizeText(item.name)
    return candidate.includes(needle) || needle.includes(candidate)
  })
  return contains?.id
}

export function resolveContactId(input: {
  requestedContactId?: string
  requestedContactName?: string
  contacts: Array<{ id: string; name: string }>
}) {
  if (input.requestedContactId) {
    const hasDirect = input.contacts.some((contact) => contact.id === input.requestedContactId)
    if (hasDirect) return input.requestedContactId
  }

  return findByName(input.requestedContactName, input.contacts)
}

export function resolveCatalogItemId(input: {
  requestedCatalogItemId?: string
  description?: string
  catalogItems: Array<{ id: string; name: string; description?: string | null }>
}) {
  if (input.requestedCatalogItemId) {
    const hasDirect = input.catalogItems.some(
      (catalogItem) => catalogItem.id === input.requestedCatalogItemId
    )
    if (hasDirect) return input.requestedCatalogItemId
  }

  const descriptionNeedle = normalizeText(input.description)
  if (!descriptionNeedle) return undefined

  const exact = input.catalogItems.find((item) => normalizeText(item.name) === descriptionNeedle)
  if (exact) return exact.id

  const byName = input.catalogItems.find((item) => {
    const name = normalizeText(item.name)
    return name.includes(descriptionNeedle) || descriptionNeedle.includes(name)
  })
  if (byName) return byName.id

  const byDescription = input.catalogItems.find((item) => {
    const description = normalizeText(item.description)
    return Boolean(
      description &&
        (description.includes(descriptionNeedle) || descriptionNeedle.includes(description))
    )
  })
  return byDescription?.id
}
