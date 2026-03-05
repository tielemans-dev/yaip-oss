import { afterEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = ["YAIP_AI_BYOK_ENABLED", "YAIP_AI_MANAGED_ENABLED"] as const

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key]
  }
}

describe("runtime extension capabilities", () => {
  afterEach(() => {
    clearEnv()
    vi.resetModules()
  })

  it("defaults to BYOK AI enabled and managed disabled", async () => {
    const mod = await import("../runtime/extensions")
    const caps = mod.getRuntimeCapabilities()

    expect(caps.aiInvoiceDraft.enabled).toBe(true)
    expect(caps.aiInvoiceDraft.byok).toBe(true)
    expect(caps.aiInvoiceDraft.managed).toBe(false)
    expect(caps.onboardingAi.enabled).toBe(false)
  })

  it("allows private extension to enable managed AI", async () => {
    const mod = await import("../runtime/extensions")

    mod.setRuntimeExtensions([
      {
        id: "cloud-managed-ai",
        resolveCapabilities: () => ({
          aiInvoiceDraft: {
            managed: true,
            managedRequiresSubscription: true,
          },
        }),
      },
    ])

    const caps = mod.getRuntimeCapabilities()
    expect(caps.aiInvoiceDraft.managed).toBe(true)
    expect(caps.aiInvoiceDraft.managedRequiresSubscription).toBe(true)
  })

  it("supports replacing extension list at runtime", async () => {
    const mod = await import("../runtime/extensions")

    mod.setRuntimeExtensions([
      {
        id: "disable-byok",
        resolveCapabilities: () => ({
          aiInvoiceDraft: {
            byok: false,
          },
        }),
      },
    ])

    expect(mod.getRuntimeCapabilities().aiInvoiceDraft.byok).toBe(false)

    mod.setRuntimeExtensions([])
    expect(mod.getRuntimeCapabilities().aiInvoiceDraft.byok).toBe(true)
  })
})
