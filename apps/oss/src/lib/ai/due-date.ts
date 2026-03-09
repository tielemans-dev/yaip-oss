import { addDays, addMonths, addWeeks, addYears, format, isValid, parseISO, startOfDay } from "date-fns"

type RelativeUnit = "day" | "week" | "month" | "year"

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  en: 1,
  et: 1,
}

function normalizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
}

function parseRelativeAmount(raw: string) {
  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber
  }
  return NUMBER_WORDS[raw]
}

function parseRelativeUnit(raw: string): RelativeUnit | null {
  if (["day", "days", "dag", "dage"].includes(raw)) return "day"
  if (["week", "weeks", "uge", "uger"].includes(raw)) return "week"
  if (["month", "months", "maned", "maaned", "maneder", "maaneder"].includes(raw)) return "month"
  if (["year", "years", "ar"].includes(raw)) return "year"
  return null
}

function applyRelativeOffset(now: Date, amount: number, unit: RelativeUnit) {
  switch (unit) {
    case "day":
      return addDays(now, amount)
    case "week":
      return addWeeks(now, amount)
    case "month":
      return addMonths(now, amount)
    case "year":
      return addYears(now, amount)
  }
}

function parseRelativeDueDateFromPrompt(prompt: string, now: Date) {
  const normalizedPrompt = normalizePrompt(prompt)

  if (/\b(i morgen|tomorrow)\b/.test(normalizedPrompt)) {
    return addDays(now, 1)
  }

  const nextMonthRegex = /\b(next|naeste)\s+(month|maned|maaned)\b/
  if (nextMonthRegex.test(normalizedPrompt)) {
    return addMonths(now, 1)
  }

  const nextWeekRegex = /\b(next|naeste)\s+(week|uge)\b/
  if (nextWeekRegex.test(normalizedPrompt)) {
    return addWeeks(now, 1)
  }

  const relativeRegex =
    /\b(in|om)\s+(\d+|one|en|et)\s+(day|days|dag|dage|week|weeks|uge|uger|month|months|maned|maaned|maneder|maaneder|year|years|ar)\b/
  const relativeMatch = normalizedPrompt.match(relativeRegex)
  if (!relativeMatch) return null

  const amount = parseRelativeAmount(relativeMatch[2])
  const unit = parseRelativeUnit(relativeMatch[3])
  if (!amount || !unit) return null

  return applyRelativeOffset(now, amount, unit)
}

export function resolveInvoiceDueDate(input: {
  prompt: string
  modelDueDate?: string
  now?: Date
}) {
  const now = startOfDay(input.now ?? new Date())
  const parsedRelativeDate = parseRelativeDueDateFromPrompt(input.prompt, now)
  if (parsedRelativeDate) {
    return format(parsedRelativeDate, "yyyy-MM-dd")
  }

  if (!input.modelDueDate) return undefined

  const parsedModelDate = parseISO(input.modelDueDate)
  if (!isValid(parsedModelDate)) return undefined

  return format(parsedModelDate, "yyyy-MM-dd")
}
