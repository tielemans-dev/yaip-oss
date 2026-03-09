import { describe, expect, it } from "vitest"
import {
  onboardingAiSuggestionSchema,
  onboardingApplySourceSchema,
  onboardingMissingFieldSchema,
  onboardingPatchSchema,
  onboardingValuesSchema,
} from "./onboarding"

describe("onboarding contracts", () => {
  it("normalizes onboarding patch values", () => {
    const parsed = onboardingPatchSchema.parse({
      companyName: "Acme Inc",
      countryCode: "dk",
      defaultCurrency: "USD",
      invoicePrefix: "INV",
      quotePrefix: "QTE",
    })

    expect(parsed.countryCode).toBe("DK")
  })

  it("accepts nullable onboarding values snapshots", () => {
    const parsed = onboardingValuesSchema.parse({
      companyName: null,
      countryCode: "us",
      invoiceNextNum: null,
      quoteNextNum: 12,
    })

    expect(parsed.countryCode).toBe("US")
    expect(parsed.quoteNextNum).toBe(12)
  })

  it("defines followup-ready suggestion payloads", () => {
    const parsed = onboardingAiSuggestionSchema.parse({
      patch: {
        companyName: "Acme Inc",
      },
      rationale: "The company name was explicit in the request.",
      confidence: 0.72,
      followupQuestions: ["What billing email should invoices use?"],
    })

    expect(parsed.patch.companyName).toBe("Acme Inc")
    expect(onboardingMissingFieldSchema.parse("companyName")).toBe("companyName")
    expect(onboardingApplySourceSchema.parse("ai")).toBe("ai")
  })
})
