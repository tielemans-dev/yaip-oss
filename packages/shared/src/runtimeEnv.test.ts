import { describe, expect, it } from "vitest"
import {
  readBooleanEnv,
  readFallbackSecret,
  resolveUrlOrigin,
} from "./runtimeEnv"

describe("runtime env helpers", () => {
  it("reads booleans with fallback defaults", () => {
    expect(readBooleanEnv("true", false)).toBe(true)
    expect(readBooleanEnv("FALSE", true)).toBe(false)
    expect(readBooleanEnv("invalid", true)).toBe(true)
  })

  it("normalizes valid origins and rejects invalid urls", () => {
    expect(resolveUrlOrigin("https://app.example.test/path")).toBe(
      "https://app.example.test"
    )
    expect(resolveUrlOrigin("not a url")).toBeNull()
  })

  it("prefers explicit secrets and falls back to secondary ones", () => {
    expect(readFallbackSecret("primary-secret-1234", "fallback-secret-1234")).toBe(
      "primary-secret-1234"
    )
    expect(readFallbackSecret(undefined, "fallback-secret-1234")).toBe(
      "fallback-secret-1234"
    )
  })
})
