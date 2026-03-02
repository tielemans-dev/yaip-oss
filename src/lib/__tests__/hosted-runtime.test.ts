import { describe, expect, it } from "vitest"
import { getHostedRuntimeConfig } from "../hosted-runtime"

describe("getHostedRuntimeConfig", () => {
  it("defaults to self-host mode", () => {
    expect(getHostedRuntimeConfig({} as NodeJS.ProcessEnv).hostedMode).toBe(false)
  })

  it("enables hosted mode from env", () => {
    const cfg = getHostedRuntimeConfig({
      HOSTED_MODE: "true",
      HOSTED_SHELL_ORIGIN: "https://yaip.com",
      HOSTED_APP_ORIGIN: "https://app.yaip.com",
    } as NodeJS.ProcessEnv)

    expect(cfg.hostedMode).toBe(true)
    expect(cfg.shellOrigin).toBe("https://yaip.com")
    expect(cfg.appOrigin).toBe("https://app.yaip.com")
  })
})
