import { describe, expect, it } from "vitest"
import { formatCurrency, formatDate } from "../format"

describe("i18n format helpers", () => {
  it("formats US currency with en-US locale", () => {
    expect(formatCurrency(1234.56, "USD", "en-US")).toBe("$1,234.56")
  })

  it("formats DKK with da-DK locale", () => {
    expect(formatCurrency(1234.56, "DKK", "da-DK")).toContain("1.234,56")
  })

  it("formats dates differently for da-DK and en-US", () => {
    const date = "2026-02-26T00:00:00.000Z"
    const us = formatDate(date, "en-US", "UTC")
    const dk = formatDate(date, "da-DK", "UTC")

    expect(us).not.toBe(dk)
  })
})
