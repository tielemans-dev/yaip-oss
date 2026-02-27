import { afterEach, describe, expect, it, vi } from "vitest"

const ENV_KEYS = [
  "YAIP_DISTRIBUTION",
  "YAIP_BILLING_ENABLED",
  "BETTER_AUTH_GOOGLE_CLIENT_ID",
  "BETTER_AUTH_GOOGLE_CLIENT_SECRET",
  "BETTER_AUTH_GITHUB_CLIENT_ID",
  "BETTER_AUTH_GITHUB_CLIENT_SECRET",
] as const

function clearDistributionEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key]
  }
}

describe("distribution flags", () => {
  afterEach(() => {
    clearDistributionEnv()
    vi.resetModules()
  })

  it("defaults to self-host with billing disabled", async () => {
    const mod = await import("../distribution")
    expect(mod.isSelfHostDistribution).toBe(true)
    expect(mod.isCloudDistribution).toBe(false)
    expect(mod.billingEnabled).toBe(false)
  })

  it("enables billing in cloud distribution by default", async () => {
    process.env.YAIP_DISTRIBUTION = "cloud"
    const mod = await import("../distribution")
    expect(mod.isCloudDistribution).toBe(true)
    expect(mod.billingEnabled).toBe(true)
  })

  it("allows disabling billing in cloud distribution with env flag", async () => {
    process.env.YAIP_DISTRIBUTION = "cloud"
    process.env.YAIP_BILLING_ENABLED = "false"
    const mod = await import("../distribution")
    expect(mod.billingEnabled).toBe(false)
  })

  it("enables oauth only when provider credentials are configured", async () => {
    let mod = await import("../distribution")
    expect(mod.oauthEnabled).toBe(false)

    vi.resetModules()
    process.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "google-id"
    process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET = "google-secret"
    mod = await import("../distribution")
    expect(mod.oauthEnabled).toBe(true)
  })
})

