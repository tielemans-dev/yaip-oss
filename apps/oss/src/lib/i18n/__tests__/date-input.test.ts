import { describe, expect, it } from "vitest"
import { formatIsoDateForInputDisplay } from "../date-input"

describe("date input locale formatting", () => {
  it("formats ISO dates in locale-specific order", () => {
    const isoDate = "2026-03-02"

    expect(formatIsoDateForInputDisplay(isoDate, "da-DK")).toMatch(/^02[./-]03[./-]2026$/)
    expect(formatIsoDateForInputDisplay(isoDate, "en-US")).toMatch(/^03[./-]02[./-]2026$/)
  })

  it("returns original value when date is not ISO format", () => {
    expect(formatIsoDateForInputDisplay("02/03/2026", "da-DK")).toBe("02/03/2026")
  })

  it("returns original value when ISO date is invalid", () => {
    expect(formatIsoDateForInputDisplay("2026-02-31", "da-DK")).toBe("2026-02-31")
  })
})
