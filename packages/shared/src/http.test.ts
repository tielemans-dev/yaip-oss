import { describe, expect, it } from "vitest"
import { buildAbsoluteUrl, resolveAppOrigin } from "./http"

describe("http helpers", () => {
  it("resolves the first valid app origin", () => {
    expect(
      resolveAppOrigin(["not-a-url", "https://app.example.test/base", undefined], "")
    ).toBe("https://app.example.test")
  })

  it("builds absolute urls from an origin and pathname", () => {
    expect(buildAbsoluteUrl("https://app.example.test", "/pay/token")).toBe(
      "https://app.example.test/pay/token"
    )
  })
})
