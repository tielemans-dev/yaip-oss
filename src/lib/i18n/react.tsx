import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { resolveLanguage, translate } from "./translate"
import type { TranslationKey } from "./messages"

type I18nContextValue = {
  locale: string
  setLocale: (locale: string) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  tm: (messages: { en: string } & Record<string, string | undefined>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function detectInitialLocale() {
  if (typeof window === "undefined") return "en-US"
  return window.navigator.language || "en-US"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<string>(detectInitialLocale)

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = resolveLanguage(locale)
    }
  }, [locale])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(key, locale, vars),
    [locale]
  )
  const tm = useCallback(
    (messages: { en: string } & Record<string, string | undefined>) => {
      const language = resolveLanguage(locale)
      return messages[language] ?? messages.en
    },
    [locale]
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tm,
    }),
    [locale, t, tm]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
