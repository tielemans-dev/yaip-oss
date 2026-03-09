import { describe, expect, it } from "vitest"
import { mapPersistedOnboardingStatus } from "../cloud-onboarding"

describe("mapPersistedOnboardingStatus", () => {
  it("keeps known onboarding status values", () => {
    expect(mapPersistedOnboardingStatus("not_started", null)).toBe("not_started")
    expect(mapPersistedOnboardingStatus("in_progress", null)).toBe("in_progress")
    expect(mapPersistedOnboardingStatus("complete", null)).toBe("complete")
  })

  it("promotes completed timestamp to complete", () => {
    expect(
      mapPersistedOnboardingStatus(
        "not_started",
        new Date("2026-03-03T00:00:00.000Z")
      )
    ).toBe("complete")
  })

  it("falls back to not_started for unknown values", () => {
    expect(mapPersistedOnboardingStatus("unexpected", null)).toBe("not_started")
    expect(mapPersistedOnboardingStatus(null, null)).toBe("not_started")
  })
})
