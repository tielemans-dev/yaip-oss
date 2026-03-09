const DEFAULT_LOCALE = "en-US"
const DEFAULT_CURRENCY = "USD"
const DEFAULT_TIMEZONE = "UTC"

export function normalizeLocale(locale?: string | null): string {
  const value = locale?.trim()
  return value || DEFAULT_LOCALE
}

export function normalizeCurrency(currency?: string | null): string {
  const value = currency?.trim().toUpperCase()
  return value || DEFAULT_CURRENCY
}

export function normalizeTimeZone(timeZone?: string | null): string {
  const value = timeZone?.trim()
  return value || DEFAULT_TIMEZONE
}
