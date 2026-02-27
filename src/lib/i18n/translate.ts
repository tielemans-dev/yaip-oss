import {
  enMessages,
  messageCatalog,
  type SupportedLanguage,
  type TranslationKey,
} from "./messages"

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

export function resolveLanguage(locale?: string | null): SupportedLanguage {
  const normalized = locale?.trim().toLowerCase() ?? ""
  if (normalized.startsWith("da")) return "da"
  return "en"
}

export function translate(
  key: TranslationKey,
  locale?: string | null,
  vars?: Record<string, string | number>
): string {
  const language = resolveLanguage(locale)
  const catalog = messageCatalog[language]
  const message = catalog[key] ?? enMessages[key] ?? key
  return interpolate(message, vars)
}
