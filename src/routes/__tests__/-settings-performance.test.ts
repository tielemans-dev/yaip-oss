import { describe, expect, it } from "vitest"

import { shouldAutoLoadOpenRouterModels } from "../_app/-settings.helpers"

describe("settings performance helpers", () => {
  it("does not auto-load models when the current model is already in the fallback list", () => {
    expect(
      shouldAutoLoadOpenRouterModels("openai/gpt-4o-mini", [
        "openai/gpt-4o-mini",
        "openai/gpt-4.1-mini",
      ])
    ).toBe(false)
  })

  it("auto-loads models when the current model is not in the fallback list", () => {
    expect(
      shouldAutoLoadOpenRouterModels("anthropic/claude-3.7-sonnet", [
        "openai/gpt-4o-mini",
        "openai/gpt-4.1-mini",
      ])
    ).toBe(true)
  })
})
