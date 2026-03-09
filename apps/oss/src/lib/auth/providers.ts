import type { BetterAuthOptions } from "better-auth"

type EnvSource = Record<string, string | undefined>

type SocialProviders = NonNullable<BetterAuthOptions["socialProviders"]>

function readPair(env: EnvSource, idKey: string, secretKey: string) {
  const clientId = env[idKey]?.trim()
  const clientSecret = env[secretKey]?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, enabled: true }
}

export function getConfiguredSocialProviders(env: EnvSource = process.env): SocialProviders {
  const google = readPair(
    env,
    "BETTER_AUTH_GOOGLE_CLIENT_ID",
    "BETTER_AUTH_GOOGLE_CLIENT_SECRET"
  )
  const github = readPair(
    env,
    "BETTER_AUTH_GITHUB_CLIENT_ID",
    "BETTER_AUTH_GITHUB_CLIENT_SECRET"
  )

  return {
    ...(google ? { google } : {}),
    ...(github ? { github } : {}),
  }
}

export function hasConfiguredSocialProviders(
  env: EnvSource = process.env
): boolean {
  return Object.keys(getConfiguredSocialProviders(env)).length > 0
}

