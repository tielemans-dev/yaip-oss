import { enCatalog } from "./en"
import { daCatalog } from "./da"

export const messageCatalog = {
  en: enCatalog,
  da: daCatalog,
} as const

export const enMessages = enCatalog
export const daMessages = daCatalog

export type TranslationKey = keyof typeof enCatalog
export type SupportedLanguage = keyof typeof messageCatalog
