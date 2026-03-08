import { betterAuth } from "better-auth"
import { getPrisma } from "./db"
import { buildYaipAuthOptions } from "./runtime/auth-config"
import { createLiveBindingProxy } from "./runtime/live-binding"
import { getRuntimePlatform } from "./runtime/platform"

type AuthInstance = ReturnType<typeof betterAuth>

let authInstance: AuthInstance | undefined
let authPlatformId: string | undefined

export function getAuth() {
  const platform = getRuntimePlatform()

  if (!authInstance || authPlatformId !== platform.id) {
    authInstance = betterAuth(
      buildYaipAuthOptions({
        prisma: getPrisma(),
        env: {
          getEnv: platform.getEnv,
        },
        hooks: platform.getAuthHooks(),
      })
    ) as AuthInstance
    authPlatformId = platform.id
  }

  return authInstance
}

export const auth = createLiveBindingProxy<AuthInstance>(() => getAuth())
