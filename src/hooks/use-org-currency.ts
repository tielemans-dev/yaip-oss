import { useEffect, useState } from "react"
import { normalizeCurrency } from "../lib/i18n/locale"
import { trpc } from "../trpc/client"

type CurrencySettings = {
  defaultCurrency?: string | null
  currency?: string | null
}

export function resolveOrgCurrency(settings?: CurrencySettings | null): string {
  return normalizeCurrency(settings?.defaultCurrency ?? settings?.currency ?? null)
}

export function useOrgCurrency() {
  const [currency, setCurrency] = useState<string>("USD")

  useEffect(() => {
    let cancelled = false
    trpc.settings.get
      .query()
      .then((settings) => {
        if (!cancelled) {
          setCurrency(resolveOrgCurrency(settings))
        }
      })
      .catch(() => {
        // Keep fallback currency when settings are unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return currency
}
