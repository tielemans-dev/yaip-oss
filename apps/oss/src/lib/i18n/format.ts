import {
  normalizeCurrency,
  normalizeLocale,
  normalizeTimeZone,
} from "./locale"

export function formatCurrency(
  amount: number,
  currency?: string | null,
  locale?: string | null
): string {
  return new Intl.NumberFormat(normalizeLocale(locale), {
    style: "currency",
    currency: normalizeCurrency(currency),
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  locale?: string | null,
  timeZone?: string | null,
  options?: {
    month?: "numeric" | "2-digit" | "long" | "short" | "narrow"
  }
): string {
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    year: "numeric",
    month: options?.month ?? "long",
    day: "numeric",
    timeZone: normalizeTimeZone(timeZone),
  }).format(new Date(date))
}
