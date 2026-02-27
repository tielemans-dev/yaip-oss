import { describe, expect, it } from "vitest"
import {
  getConfiguredSocialProviders,
  hasConfiguredSocialProviders,
} from "../auth/providers"

describe("auth provider configuration", () => {
  it("returns empty providers by default", () => {
    const env = {}
    expect(getConfiguredSocialProviders(env)).toEqual({})
    expect(hasConfiguredSocialProviders(env)).toBe(false)
  })

  it("includes google provider when credentials are set", () => {
    const env = {
      BETTER_AUTH_GOOGLE_CLIENT_ID: "google-id",
      BETTER_AUTH_GOOGLE_CLIENT_SECRET: "google-secret",
    }

    expect(getConfiguredSocialProviders(env)).toEqual({
      google: {
        clientId: "google-id",
        clientSecret: "google-secret",
        enabled: true,
      },
    })
  })

  it("includes github provider when credentials are set", () => {
    const env = {
      BETTER_AUTH_GITHUB_CLIENT_ID: "github-id",
      BETTER_AUTH_GITHUB_CLIENT_SECRET: "github-secret",
    }

    expect(getConfiguredSocialProviders(env)).toEqual({
      github: {
        clientId: "github-id",
        clientSecret: "github-secret",
        enabled: true,
      },
    })
  })
})

