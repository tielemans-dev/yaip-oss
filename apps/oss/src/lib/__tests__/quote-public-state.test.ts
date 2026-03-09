import { describe, expect, it } from "vitest"
import {
  applyPublicQuoteDecision,
  assertQuoteCommercialFieldsMutable,
  getQuotePublicDecisionState,
  signQuotePublicToken,
  verifyQuotePublicToken,
} from "../quotes/public"

describe("quote public state", () => {
  it("treats sent quotes without a public decision as pending", () => {
    expect(
      getQuotePublicDecisionState({
        status: "sent",
        publicDecisionAt: null,
      })
    ).toBe("pending")
  })

  it("allows only the first public decision to win", () => {
    const accepted = applyPublicQuoteDecision(
      {
        status: "sent",
        publicDecisionAt: null,
        publicRejectionReason: null,
      },
      {
        decision: "accepted",
        decidedAt: new Date("2026-03-05T12:00:00.000Z"),
      }
    )

    expect(accepted.status).toBe("accepted")
    expect(accepted.publicDecisionAt?.toISOString()).toBe("2026-03-05T12:00:00.000Z")

    expect(() =>
      applyPublicQuoteDecision(accepted, {
        decision: "rejected",
        decidedAt: new Date("2026-03-05T12:05:00.000Z"),
        rejectionReason: "Changed mind",
      })
    ).toThrow(/already has a customer decision/i)
  })

  it("blocks commercial edits for accepted quotes", () => {
    expect(() =>
      assertQuoteCommercialFieldsMutable({
        status: "accepted",
      })
    ).toThrow(/accepted quotes are locked/i)
  })

  it("rejects invalid public token signatures", () => {
    const token = signQuotePublicToken(
      {
        quoteId: "quote_123",
        keyVersion: 1,
        scope: "quote_public",
      },
      "super-secret"
    )

    expect(
      verifyQuotePublicToken(`${token.slice(0, -1)}x`, "super-secret")
    ).toBeNull()
  })
})
