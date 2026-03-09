import { z } from "zod"

export const nonEmptyStringSchema = z.string().trim().min(1)
export const countryCodeSchema = z
  .string()
  .trim()
  .length(2)
  .transform((value) => value.toUpperCase())
export const currencyCodeSchema = z.string().trim().regex(/^[A-Z]{3}$/)
export const isoDateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
export const keyVersionSchema = z.number().int().nonnegative()

export const runtimeExtensionIdSchema =
  nonEmptyStringSchema.max(120).brand<"RuntimeExtensionId">()
export const organizationIdSchema =
  nonEmptyStringSchema.max(100).brand<"OrganizationId">()
export const invoiceIdSchema = nonEmptyStringSchema.max(100).brand<"InvoiceId">()
export const quoteIdSchema = nonEmptyStringSchema.max(100).brand<"QuoteId">()

export type RuntimeExtensionId = z.infer<typeof runtimeExtensionIdSchema>
export type OrganizationId = z.infer<typeof organizationIdSchema>
export type InvoiceId = z.infer<typeof invoiceIdSchema>
export type QuoteId = z.infer<typeof quoteIdSchema>
