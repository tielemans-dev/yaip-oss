import { describe, expect, it } from "vitest"
import {
  publicQuoteDecisionInputSchema,
  quotePublicDecisionStateSchema,
  quotePublicTokenPayloadSchema,
} from "./quotes"

describe("quote contracts", () => {
  it("parses public quote token payloads", () => {
    const payload = quotePublicTokenPayloadSchema.parse({
      quoteId: "quo_123",
      keyVersion: 2,
      scope: "quote_public",
    })

    expect(payload.scope).toBe("quote_public")
  })

  it("parses public quote decision inputs", () => {
    const parsed = publicQuoteDecisionInputSchema.parse({
      token: "signed-token",
      decision: "accepted",
    })

    expect(parsed.decision).toBe("accepted")
    expect(quotePublicDecisionStateSchema.parse("pending")).toBe("pending")
  })
})
