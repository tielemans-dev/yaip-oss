import { describe, expect, it } from "vitest"
import {
  emailDeliveryAttemptSnapshotSchema,
  emailDeliveryRuntimeStatusSchema,
} from "./email"

describe("email contracts", () => {
  it("accepts nullable persisted delivery snapshots", () => {
    const parsed = emailDeliveryAttemptSnapshotSchema.parse({
      lastEmailAttemptAt: null,
      lastEmailAttemptOutcome: null,
      lastEmailAttemptCode: null,
      lastEmailAttemptMessage: null,
    })

    expect(parsed.lastEmailAttemptOutcome).toBeNull()
  })

  it("rejects unknown runtime delivery statuses", () => {
    const parsed = emailDeliveryRuntimeStatusSchema.safeParse({
      managed: false,
      configured: false,
      available: false,
      sender: "noreply@example.test",
      missing: ["RESEND_API_KEY"],
      status: "unknown",
    })

    expect(parsed.success).toBe(false)
  })
})
