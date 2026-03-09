import { z } from "zod"
import { keyVersionSchema, nonEmptyStringSchema, quoteIdSchema } from "./baseSchemas"

export const quotePublicDecisionSchema = z.enum(["accepted", "rejected"])
export const quotePublicDecisionStateSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
])
export const quotePublicScopeSchema = z.literal("quote_public")

export const quotePublicTokenPayloadSchema = z
  .object({
    quoteId: quoteIdSchema,
    keyVersion: keyVersionSchema,
    scope: quotePublicScopeSchema,
  })
  .strict()

export const publicQuoteTokenInputSchema = z
  .object({
    token: nonEmptyStringSchema,
  })
  .strict()

export const publicQuoteDecisionInputSchema = publicQuoteTokenInputSchema
  .extend({
    decision: quotePublicDecisionSchema,
    rejectionReason: z.string().trim().max(500).optional(),
  })
  .strict()

export const quotePublicSnapshotSchema = z
  .object({
    status: z.string(),
    publicDecisionAt: z.date().nullable(),
    publicRejectionReason: z.string().nullable().optional(),
  })
  .strict()

export type QuotePublicDecision = z.infer<typeof quotePublicDecisionSchema>
export type QuotePublicDecisionState = z.infer<
  typeof quotePublicDecisionStateSchema
>
export type QuotePublicScope = z.infer<typeof quotePublicScopeSchema>
export type QuotePublicTokenPayload = z.infer<
  typeof quotePublicTokenPayloadSchema
>
export type QuotePublicSnapshot = z.infer<typeof quotePublicSnapshotSchema>
export type PublicQuoteTokenInput = z.infer<typeof publicQuoteTokenInputSchema>
export type PublicQuoteDecisionInput = z.infer<
  typeof publicQuoteDecisionInputSchema
>
