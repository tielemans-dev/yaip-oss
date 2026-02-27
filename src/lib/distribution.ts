const runtimeEnv =
  typeof process !== "undefined"
    ? process.env
    : ({} as Record<string, string | undefined>)

const distribution = (runtimeEnv.YAIP_DISTRIBUTION ?? "selfhost")
  .trim()
  .toLowerCase()

function hasOauthProvider(clientIdEnv: string, clientSecretEnv: string) {
  const clientId = runtimeEnv[clientIdEnv]?.trim()
  const clientSecret = runtimeEnv[clientSecretEnv]?.trim()
  return Boolean(clientId && clientSecret)
}

export const isCloudDistribution = distribution === "cloud"
export const isSelfHostDistribution = !isCloudDistribution

export const billingEnabled =
  isCloudDistribution && runtimeEnv.YAIP_BILLING_ENABLED?.trim().toLowerCase() !== "false"

export const oauthEnabled =
  hasOauthProvider("BETTER_AUTH_GOOGLE_CLIENT_ID", "BETTER_AUTH_GOOGLE_CLIENT_SECRET") ||
  hasOauthProvider("BETTER_AUTH_GITHUB_CLIENT_ID", "BETTER_AUTH_GITHUB_CLIENT_SECRET")
