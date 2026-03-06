import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { decidePublicQuoteByToken, loadPublicQuoteByToken } from "./public-access"
import { getPublicQuoteSecret } from "./public-url"

const publicQuoteTokenSchema = z.object({
  token: z.string().trim().min(1),
})

const publicQuoteDecisionSchema = publicQuoteTokenSchema.extend({
  decision: z.enum(["accepted", "rejected"]),
  rejectionReason: z.string().trim().max(500).optional(),
})

export const getPublicQuoteSession = createServerFn({ method: "GET" })
  .inputValidator(publicQuoteTokenSchema)
  .handler(async ({ data }) => {
    const session = await loadPublicQuoteByToken(data.token, getPublicQuoteSecret())
    if (!session) {
      return { kind: "invalid" } as const
    }

    return {
      kind: "ready",
      ...session,
    } as const
  })

export const submitPublicQuoteDecision = createServerFn({ method: "POST" })
  .inputValidator(publicQuoteDecisionSchema)
  .handler(async ({ data }) => {
    try {
      const session = await decidePublicQuoteByToken(data.token, getPublicQuoteSecret(), {
        decision: data.decision,
        rejectionReason: data.decision === "rejected" ? data.rejectionReason : undefined,
      })

      return {
        kind: "ready",
        ...session,
      } as const
    } catch {
      return { kind: "invalid" } as const
    }
  })
