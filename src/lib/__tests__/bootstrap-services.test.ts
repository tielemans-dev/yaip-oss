import { afterEach, describe, expect, it, vi } from "vitest"

async function loadModule() {
  vi.resetModules()
  return import("../runtime/services")
}

describe("runtime service registration", () => {
  afterEach(async () => {
    const mod = await loadModule()
    mod.resetRuntimeServices()
  })

  it("uses noop billing provider by default", async () => {
    const mod = await loadModule()

    const subscription = await mod.getBillingProvider().getSubscription("org-1")
    expect(subscription).toEqual({ status: "free", priceId: null })
  })

  it("allows overriding billing provider at runtime", async () => {
    const mod = await loadModule()

    mod.setRuntimeServices({
      billingProvider: {
        getSubscription: async () => ({ status: "active", priceId: "price_123" }),
        assertInvoiceCreationAllowed: async () => {},
      },
    })

    const subscription = await mod.getBillingProvider().getSubscription("org-1")
    expect(subscription).toEqual({ status: "active", priceId: "price_123" })
  })

  it("provides a default onboarding ai service and supports override", async () => {
    const mod = await loadModule()

    const suggested = await mod.getOnboardingAiService().suggestPatch({
      userMessage: "We are in Denmark and use VAT. billing@acme.example",
      currentValues: {},
      missing: ["companyName", "companyAddress", "companyEmail"],
    })
    expect(suggested.patch.countryCode).toBe("DK")

    mod.setRuntimeServices({
      onboardingAiService: {
        suggestPatch: async () => ({
          patch: { companyName: "Custom Name" },
          rationale: "test",
          confidence: 1,
          followupQuestions: [],
        }),
      },
    })

    const overridden = await mod.getOnboardingAiService().suggestPatch({
      userMessage: "unused",
      currentValues: {},
      missing: [],
    })
    expect(overridden.patch.companyName).toBe("Custom Name")
  })
})
