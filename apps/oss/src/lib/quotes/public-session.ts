import { createServerFn } from "@tanstack/react-start"
import {
  publicQuoteDecisionInputSchema,
  publicQuoteTokenInputSchema,
} from "@yaip/contracts/quotes"

export const getPublicQuoteSession = createServerFn({ method: "GET" })
  .inputValidator(publicQuoteTokenInputSchema)
  .handler(async ({ data }) => {
    const [{ loadPublicQuoteByToken }, { getPublicQuoteSecret }] = await Promise.all([
      import("./public-access"),
      import("./public-url"),
    ])
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
  .inputValidator(publicQuoteDecisionInputSchema)
  .handler(async ({ data }) => {
    try {
      const [{ decidePublicQuoteByToken }, { getPublicQuoteSecret }] = await Promise.all([
        import("./public-access"),
        import("./public-url"),
      ])
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
