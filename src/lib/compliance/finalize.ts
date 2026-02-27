import type { TaxId } from "./country-profile"

type PartySnapshot = {
  name?: string | null
  address?: string | null
  taxIds?: TaxId[]
}

export function finalizeSnapshots(input: {
  seller: PartySnapshot
  buyer: PartySnapshot
}) {
  return {
    sellerSnapshot: {
      name: input.seller.name ?? null,
      address: input.seller.address ?? null,
      taxIds: input.seller.taxIds ?? [],
    },
    buyerSnapshot: {
      name: input.buyer.name ?? null,
      address: input.buyer.address ?? null,
      taxIds: input.buyer.taxIds ?? [],
    },
  }
}
