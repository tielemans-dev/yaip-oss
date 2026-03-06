import { describe, expect, it } from "vitest"
import {
  createEmailDeliveryAttempt,
  readEmailDeliveryAttempt,
} from "../email-delivery"

describe("email delivery helpers", () => {
  it("builds a persisted delivery attempt record", () => {
    const at = new Date("2026-03-06T16:20:00.000Z")

    expect(
      createEmailDeliveryAttempt({
        at,
        outcome: "skipped",
        code: "provider_missing",
        message: "Email not configured (RESEND_API_KEY missing)",
      })
    ).toEqual({
      lastEmailAttemptAt: at,
      lastEmailAttemptOutcome: "skipped",
      lastEmailAttemptCode: "provider_missing",
      lastEmailAttemptMessage: "Email not configured (RESEND_API_KEY missing)",
    })
  })

  it("returns null when a document has no recorded delivery attempt", () => {
    expect(
      readEmailDeliveryAttempt({
        lastEmailAttemptAt: null,
        lastEmailAttemptOutcome: null,
        lastEmailAttemptCode: null,
        lastEmailAttemptMessage: null,
      })
    ).toBeNull()
  })
})
