import { normalizeLocale } from "./locale"

function parseIsoDateParts(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const probe = new Date(Date.UTC(year, month - 1, day))
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export function formatIsoDateForInputDisplay(isoDate: string, locale?: string | null) {
  const parsed = parseIsoDateParts(isoDate)
  if (!parsed) return isoDate

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}
