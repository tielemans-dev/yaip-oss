import { describe, expect, it } from "vitest"
import { normalizeHostedNext } from "../redirect-target"

describe("normalizeHostedNext", () => {
  it("accepts app.yaip.com same-origin paths", () => {
    expect(normalizeHostedNext("https://app.yaip.com/invoices/123", "https://app.yaip.com")).toBe(
      "https://app.yaip.com/invoices/123"
    )
  })

  it("rejects off-domain targets", () => {
    expect(normalizeHostedNext("https://evil.com/pwn", "https://app.yaip.com")).toBe(
      "https://app.yaip.com/"
    )
  })

  it("falls back when next is missing or invalid", () => {
    expect(normalizeHostedNext(undefined, "https://app.yaip.com")).toBe("https://app.yaip.com/")
    expect(normalizeHostedNext("/invoices", "https://app.yaip.com")).toBe("https://app.yaip.com/")
  })
})
